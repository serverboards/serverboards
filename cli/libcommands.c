/**
 * Copyright 2014-2015 David Moreno
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Originally distributed at https://github.com/davidmoreno/commands .
 * Change at free will.
 */

#define _GNU_SOURCE

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dirent.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>
#include <fcntl.h>
#include <ctype.h>
#include <stdbool.h>

#include "libcommands.h"

char *commands_name=NULL;
unsigned int commands_name_length=0;
const char *COMMANDS_PATH="COMMANDS_PATH";

typedef struct subcommand_list_t{
	subcommand_t *list;
	size_t count;
	size_t size;
}subcommand_list_t;


/// Global with all known subcommands. Global as i may be used several times in the same execution. ie: shell
subcommand_list_t *subcommandlist=NULL;


/**
 * @{ @name Subcommands
 *
 * Prepares the lists of subcommands
 */
static int foreach_pathlist(const char *search_paths, void (*feach)(void *, const char *path), void *userdata);
static void scandir_add_to_subcommandlist(void *l, const char *dirname);

static int subcommand_cmp(subcommand_t *a, subcommand_t *b){
	return strcmp(a->name, b->name);
}
#ifdef DEBUG
void commands_debug(){
#ifdef CONFIG_FILE
	printf("CONFIG_FILE_0=%s\n", CONFIG_FILE);
#endif
	char tmp[1024];
	snprintf(tmp, sizeof(tmp), "/etc/%s", commands_name);
	printf("CONFIG_FILE_1=%s\n", tmp);
	snprintf(tmp, sizeof(tmp), "%s/.config/%s", getenv("HOME"), commands_name);
	printf("CONFIG_FILE_2=%s\n", tmp);
	snprintf(tmp, sizeof(tmp), "./%src", commands_name);
	printf("CONFIG_FILE_3=%s\n", tmp);


	#ifdef DEFAULT_COMMANDS_PATH
	printf("DEFAULT_COMMANDS_PATH=%s\n", DEFAULT_COMMANDS_PATH);
#endif
	printf("COMMANDS_PATH=%s\n", getenv(COMMANDS_PATH));
	printf("commands_name=%s\n", commands_name);
	printf("command_length=%d\n", commands_name_length);
}
#endif
void subcommand_list_init(){
	if (subcommandlist)
		return;
	subcommand_list_t *scl=malloc(sizeof(subcommand_list_t));
	scl->count=0;
	scl->size=8;
	scl->list=malloc(sizeof(subcommand_t)*scl->size);
	subcommandlist=scl;

	{
		subcommand_t toins[]={
			{ .name="help", .type=SC_INTERNAL, .f=commands_help, .one_line_help="Show help" },
			{ .name="--help", .type=SC_INTERNAL | SC_NOHELP, .f=commands_help, .one_line_help="Show help" },
			{ .name="--list", .type=SC_INTERNAL | SC_NOHELP, .f=commands_list, .one_line_help="Shows list of all commands and arguments" },
			{ .name="--which", .type=SC_INTERNAL_ARGS | SC_NOHELP, .f_with_args=commands_which, .one_line_help="Prints full path of the given commands" },
#ifdef VERSION
			{ .name="--version", .type=SC_INTERNAL_1, .f_with_data=(void*)puts, .f_data=VERSION, .one_line_help="Shows current version" },
#endif
#ifdef ONE_LINE_HELP
			{ .name="--one-line-help", .type=SC_INTERNAL_1 | SC_NOHELP, .f_with_data=(void*)puts, .f_data=ONE_LINE_HELP, .one_line_help="Shows one line help" },
#endif
#ifdef DEBUG
			{ .name="debug", .type=SC_INTERNAL, .f=commands_debug, .one_line_help="Shows debug information" },
#endif
			{ .name=NULL }
		};
		subcommand_t *I=toins;
		while(I->name){
			subcommand_list_add(I);
			++I;
		}
	}

#ifdef PRE_INIT_F
	PRE_INIT_F();
#endif

	foreach_pathlist(getenv(COMMANDS_PATH), scandir_add_to_subcommandlist, scl);

	qsort(scl->list, scl->count, sizeof(subcommand_t), (void*)subcommand_cmp);
}

void subcommand_list_free(){
	subcommand_list_t *scl=subcommandlist;
	if (!scl)
		return;
	subcommand_t *I=subcommand_list_begin(), *endI=subcommand_list_end();
	for(;I!=endI;++I){
		free(I->name);
		if (I->type==SC_EXTERNAL || I->type==SC_EXPORT_ENV)
			free(I->fullpath);
		if (I->one_line_help)
			free(I->one_line_help);
	}
	free(scl->list);
	free(scl);
	subcommandlist=NULL;
}

/// Adds a subcommand to the list. Avoid dups based on name.
subcommand_t *subcommand_list_add(subcommand_t *command){
	subcommand_t *I=subcommand_list_begin(), *endI=subcommand_list_end();
	for(;I!=endI;++I){
		if (strcmp(I->name, command->name)==0)
			return I;
	}
	subcommand_list_t *scl=subcommandlist;
	if (scl->size < scl->count+1){
		scl->size+=8;
		scl->list=realloc(scl->list, sizeof(subcommand_t)*scl->size);
	}
	I=subcommand_list_end();
	I->name=strdup(command->name);
	I->type=command->type;
	switch(I->type & SC_TYPE_MASK){
		case SC_EXTERNAL:
			I->fullpath=strdup(command->fullpath);
			break;
		case SC_EXPORT_ENV:
			I->env_name=strdup(command->env_name);
			if (command->env_name)
				I->env_value=strdup(command->env_value);
			else
				I->env_value=NULL;
			break;
		case SC_INTERNAL:
			I->f=command->f;
			break;
		case SC_INTERNAL_1:
			I->f_with_data=command->f_with_data;
			I->f_data=command->f_data;
			break;
		case SC_INTERNAL_ARGS:
			I->f_with_args=command->f_with_args;
			break;
		default:
			break; // Ignore BLACKLISTED. Actually here can not happen.
	}
	if (command->one_line_help)
		I->one_line_help=strdup(command->one_line_help);
	else
		I->one_line_help=NULL;
	scl->count++;

	return I;
}

static int scandir_startswith_commands_name(const struct dirent *d){
// 	printf("Check %s %d %s %ld\n",d->d_name, strncmp(d->d_name, commands_name, commands_name_length), commands_name, commands_name_length);
	if (d->d_name[strlen(d->d_name)-1]=='~')
		return 0;
	return
		(strncmp(d->d_name, commands_name, commands_name_length)==0) &&
		d->d_name[commands_name_length]=='-' &&
		d->d_type&0111;
}

static bool is_valid_command_name(const char *name){
	if (strstr(name, "--"))
		return false;
	return true;
}

static void scandir_add_to_subcommandlist(void *l, const char *dirname){
	struct dirent **namelist;

	int n=scandir(dirname, &namelist, scandir_startswith_commands_name, alphasort);
	if (n<0){
		fprintf(stderr, "Cant scan dir in path: <%s>",dirname);
		perror(":");
		return;
	}
	char tmp[1024], tmp2[1024];
	struct stat st;
	while (n--) {
		snprintf(tmp, sizeof(tmp), "%s/%s", dirname, namelist[n]->d_name);
		if (!is_valid_command_name(namelist[n]->d_name))
			continue;
		if (stat(tmp, &st) >= 0){
			if (st.st_mode & 0111){ // Excutable for anybody.
				subcommand_t toins;
				strcpy(tmp2, namelist[n]->d_name+commands_name_length+1);
				// remove .py .sh and so on
				char *p=tmp2;
				for (;*p;++p){
					if (*p=='.'){
						*p=0;
						break;
					}
				}
				toins.name=tmp2;
				toins.type=SC_EXTERNAL;
				toins.fullpath=tmp;
				toins.one_line_help=NULL;
				subcommand_list_add(&toins);
			}
		}
		free(namelist[n]);
	}
	free(namelist);
}

static int foreach_pathlist(const char *search_paths, void (*feach)(void *, const char *path), void *userdata){
	char *paths=strdup(search_paths);;
	char *path=paths;
	while(*path){ // While some path left
		char *next=strchr(path, ':');
		if (next){ // Set to 0, and go to next char.
			*next='\0';
			next++;
		}

		feach(userdata, path);

		path=next;
		if (!next)
			break; // Normal exit point.
	}

	free(paths);
	return 0;
}

subcommand_t *subcommand_list_begin(){
	subcommand_list_init();
	return subcommandlist->list;
}
subcommand_t *subcommand_list_end(){
	return subcommandlist->list+subcommandlist->count;
}

/**
 * @}
 */


/**
 * @{ @name string utils
 */
static const char *string_trim(char *str){
	// Trim start
	while (*str && isspace(*str)){
		str++;
	}

	// Trim end
	char *end=str+strlen(str);
	while ( end>str && isspace(*end) ){
		end--;
	}
	*end=0;

	return str;
}

/// Returns a new string with env ($ENV) variables resolved.
static char *string_envformat(const char *str){
	size_t ressize=strlen(str)+512;
	char *begin_res=malloc(ressize); // An estimation.. might be way wrong.
	char *res=begin_res;
	char *resend=res+ressize-1;
	char tvarname[256];
	char *varname=NULL;

	while(*str){
		if (res>=resend){
			goto end;
		}
		if (*str=='$'){
			str++;
			if (*str=='$'){
				*res++='$';
			}
			else{
				varname=tvarname;
				*varname=*str;
			}
		}
		if (varname){
			if (isalnum(*str))
				*varname++=*str;
			else{
				*varname=0;
				char *env=getenv(tvarname);
				strncpy(res, env, resend-res);
				size_t lenv=strlen(env);
				if (res+lenv>resend)
					goto end;
				res+=lenv;
				varname=NULL;
				*res++=*str;
			}
		}
		else
			*res++=*str;
		str++;
	}
	if (varname){
		*varname=0;
		char *env=getenv(tvarname);
		strncpy(res, env, resend-res);
		res+=strlen(env);
	}
end:
	*res=0;
	return begin_res;
}
/// @}

/// @{ @name Config management
/// Parses a line of the config file
static int config_parse_line(char *line){
	char *comments=strchr(line, '#');
	if (comments)
		*comments=0;
	if (strlen(string_trim(line))==0)
		return 0;
	char *eq=strchr(line,'=');
	if (!eq)
		return 1;
	*eq=0;

	const char *key=string_trim(line);
	const char *val=string_trim(eq+1);
	char *final_val=string_envformat(val);

// 	printf("<%s>=<%s>\n", key, final_val);
	setenv(key, final_val, 1);
	free(final_val);
	return 0;
}

static int config_parse_file(const char *filename){
	int fd=open(filename, O_RDONLY);
	if (fd<0)
		return fd;
	char tmp[1025];
	char line[1024];
	int nr;
	int lineno=0;
	while ( (nr=read(fd, tmp, sizeof(tmp)-1)) > 0){
		tmp[nr]=0;
// 		printf("Read block: <%s>\n", tmp);
		if (nr<sizeof(tmp))
			tmp[nr]=0; // EOF
		char *where=tmp;
		char *where_next=NULL;
		*line=0;
		while ( (where_next=strchr(where, '\n')) ){
			lineno++;
			*where_next='\0';
			strncat(line, where, sizeof(line)-1);

			// Process the line
			if (config_parse_line(line)!=0)
				goto error;
			*line=0;

			where=where_next+1;
		}
		strncpy(line, where, tmp + sizeof(tmp) - where);
		if (nr<sizeof(tmp)){
			// Process the line
			if (config_parse_line(line)!=0)
				goto error;
		}
	}

	close(fd);
	return 0;
error:
	fprintf(stderr, "Error parsing config file %s:%d", filename, lineno);
	close(fd);
	return 1;
}

/// Parses the config files
void commands_config_parse(){
	char tmp[256];

#ifdef CONFIG_FILE
	config_parse_file(CONFIG_FILE);
#endif
	snprintf(tmp, sizeof(tmp), "/etc/%s", commands_name);
	config_parse_file(tmp);
	snprintf(tmp, sizeof(tmp), "%s/.config/%s", getenv("HOME"), commands_name);
	config_parse_file(tmp);

#ifdef DEBUG
	snprintf(tmp, sizeof(tmp), "./%src", commands_name);
	config_parse_file(tmp);
#endif

}

/// @}

/// @{ @name Public API

subcommand_t *subcommand_find(const char *name){
	subcommand_t *ret=NULL;

	subcommand_t *I=subcommand_list_begin(), *endI=subcommand_list_end();
	for(;I!=endI;++I){
		if (strcmp(I->name, name)==0){
			ret=I;
			break;
		}
	}

	return ret;
}


static void list_subcommands_one_line_help(){
	char tmp[1024];
	subcommand_t *I=subcommand_list_begin();
	subcommand_t *endI=subcommand_list_end();
	int mode=0; // 0 nothing yet, 1 is arguments, 1 is commands
	for(;I!=endI;++I){
		if (I->type & SC_NOHELP) // Do not show help
			continue;

		if (mode!=1 && I->name[0]=='-'){
			mode=1;
			printf("Known arguments are:\n");
		}
		if (mode!=2 && I->name[0]!='-'){
			mode=2;
			printf("\nKnown commands are:\n");
		}
		printf("  %16s - ", I->name);
		fflush(stdout);
		switch(I->type){
			case SC_EXTERNAL:
				snprintf(tmp, sizeof(tmp), "%s --one-line-help", I->fullpath);
				system(tmp);
				break;
			default:
				if (I->one_line_help)
					printf("%s\n",  I->one_line_help);
				break;
		}
	}
}

/**
 * @short Shows the list of subcommands with the one line help of each.
 */
void commands_help(){
	printf("%s <arguments|command> ...\n", commands_name);
#ifdef PREAMBLE
	printf("%s\n", PREAMBLE);
#endif
	list_subcommands_one_line_help();
	printf("\n");
}

/**
 * @short Prints all known subcommands.
 */
void commands_list(){
	subcommand_t *I=subcommand_list_begin();
	subcommand_t *endI=subcommand_list_end();
	for(;I!=endI;++I){
		printf("%s ", I->name);
	}
	printf("\n");
}

int commands_which(int argc, char **argv){
	if (argc<2){
		fprintf(stderr,"Please state command to get full path\n");
		return -1;
	}
	subcommand_t *I=subcommand_find(argv[1]);
	if (I){
		if (I->type!=SC_EXTERNAL){
			fprintf(stderr,"[This is an internal command]\n");
			return 2;
		}
		puts(I->fullpath);
		return 2;
	}
	fprintf(stderr,"Command not found\n");
	return -1;
}

/**
 * @short Runs a specific subcommand, replacing current process (exec).
 *
 * @returns Number of arguments consumed, 0 to stop execution, and <0 for errors. 1 means consume and continue.
 */
int commands_run(const char *subcommand, int argc, char **argv){
// 	fprintf(stderr, "Run %s + %d args\n", subcommand, argc-1);
	if (subcommand[0]=='-'){
		char *eq_pos=strchr(subcommand, '=');
		if ( eq_pos ){ // If it has =, split there set as two first arguments, do again.
			char *nargv[argc+1];
			nargv[0]=strdup(subcommand);
			nargv[0][eq_pos-subcommand]=0;
			nargv[1]=&argv[0][eq_pos-subcommand+1];
			int i;
			for(i=1;i<argc;i++)
				nargv[i+1]=argv[i];

// 			fprintf(stderr, "Split run:\n");
// 			for(i=0;i<argc+1;i++)
// 				fprintf(stderr, "  %s\n", nargv[i]);

			i=commands_run(nargv[0], argc+1, nargv);
			if (i>0)
				i--;
			free(nargv[0]);
			return i;
		}
	}

	subcommand_t *command=subcommand_find(subcommand);
	if (!command){
		if (subcommand[0]=='-')
			fprintf(stderr,"Invalid argument %s. Check available running %s without arguments.\n", subcommand, commands_name);
		else
			fprintf(stderr,"Command %s not found. Check available running %s without arguments.\n", subcommand, commands_name);
		return -1;
	}
	switch(command->type & SC_TYPE_MASK){
	case SC_EXTERNAL:
		execv(command->fullpath, argv);
		perror("Could not execute subcommand: ");
		return -1;
		break;
	case SC_INTERNAL:
		command->f();
		break;
	case SC_EXPORT_ENV:
		if (command->env_value)
			setenv(command->env_name, command->env_value, 1);
		else
			setenv(command->env_name, "1", 1);
		return 1;
		break;
	case SC_INTERNAL_1:
		command->f_with_data(command->f_data);
		break;
	case SC_INTERNAL_ARGS:
	{
		int ret=command->f_with_args(argc, argv);
// 		fprintf(stderr, "%s: %d\n", command->name, ret);
		return ret;
		break;
	}
	default:
		if (! (command->type&SC_BLACKLISTED) ){
			fprintf(stderr, "Unknown command type %d\n", command->type & SC_TYPE_MASK);
			abort();
		}
		else{
			fprintf(stderr, "Command %s is not allowed\n", command->name);
		}
		break;
	}
	return 1;
}

/**
 * @short Performs the default main.
 *
 * Its is usefull as another function, so it can be easily customized to allow more command line
 * options, and call this for default ones.
 */
int commands_main(int argc, char **argv){
#ifdef DEFAULT_COMMANDS_PATH
	setenv(COMMANDS_PATH, DEFAULT_COMMANDS_PATH, 1);
#else
	setenv(COMMANDS_PATH, getenv("PATH"), 1);
#endif

#ifdef COMMAND_NAME
	commands_name=COMMAND_NAME;
#else
	commands_name=basename( argv[0] );
#endif
	commands_name_length=strlen(commands_name);

	setenv("COMMANDS_NAME", commands_name, 1);

	commands_config_parse();
	int retcode=0;

	if (argc==1){
		commands_help();
	}
	else{
		argv++;
		argc--;
		while(argc>0){
			retcode=commands_run(argv[0], argc, argv);
// 			fprintf(stderr, "Args: %s %d: %d\n", argv[0], argc, retcode);
			if (retcode<=0)
				break;
			argc-=retcode;
			argv+=retcode;
		}
	}
	if (retcode<0)
		retcode=-retcode;
	else
		retcode=0;

	subcommand_list_free(subcommandlist);
	return retcode;
}

/// @}
