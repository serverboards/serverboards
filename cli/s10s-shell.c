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

#include <sys/wait.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <ctype.h>

#include "libcommands.h"

/**
 * @short Runs a specific subcommand, NOT replacing current process.
 */
int commands_run_no_exec(const char *subcommand, int argc, char **argv){
	subcommand_t *command=subcommand_find(subcommand);
	
	if (!command){
		fprintf(stderr, "Invalid command: %s\n", subcommand);
		return -1;
	}
	if (command->type==SC_EXTERNAL){ // If external, will do execv, do fork here
		pid_t pid;
		if ( (pid=fork()) == 0){
			commands_run(subcommand, argc, argv);
			exit(1); // If got here, command was not run properly.
		}
		int status=0;
		waitpid(pid,&status,0);
		if (!WIFEXITED(status)){
			fprintf(stderr, "Error executing command %s.\n", subcommand);
		}
		return WEXITSTATUS(status);
	}
	else{ // If not, jsut run.
		return commands_run(subcommand, argc, argv);
	}
}

/**
 * @short Updates allowed commands acording to config file SHELL_WHITELIST and SHELL_BLACKLIST
 * 
 * First removes all not at whitelist, then all from blacklist.
 * 
 * A command with empty name (string length 0) is not valid. At end we really remove them.
 */
void update_allowed_commands(){
	if (getenv("SHELL_WHITELIST")){
		{ // Blacklist all.
			subcommand_t *I=subcommand_list_begin(), *endI=subcommand_list_end();
			for(;I!=endI;++I)
				I->type|=SC_BLACKLISTED;
		}
		// Allow some.
		char *whitelist=strdupa( getenv("SHELL_WHITELIST") );
		char *I=whitelist, *endI=whitelist+strlen(whitelist);
		while (*whitelist){
			while (*whitelist && !isspace(*whitelist))
				whitelist++;
			*whitelist=0;
			subcommand_t *command=subcommand_find(I);
			if (command){
				fprintf(stderr,"Whitelist %s\n", command->name);
				command->type&=~SC_BLACKLISTED; // Clear.
			}
			if (whitelist>=endI)
				break;
			whitelist++;
			while (isspace(*whitelist)) whitelist++; // Advance to next.
			I=whitelist;
		}
	}
	
	if (getenv("SHELL_BLACKLIST")){
		char *blacklist=strdupa( getenv("SHELL_BLACKLIST") );
		char *I=blacklist, *endI=blacklist+strlen(blacklist);
		while (*blacklist){
			while (*blacklist && !isspace(*blacklist))
				blacklist++;
			*blacklist=0;
			subcommand_t *command=subcommand_find(I);
			if (command){
				fprintf(stderr,"Blacklist %s\n", command->name);
				command->type|=SC_BLACKLISTED;
			}
			if (blacklist>=endI)
				break;
			blacklist++;
			while (isspace(*blacklist)) blacklist++; // Advance to next.
			I=blacklist;
		}
	}
}

int main(int argc, char **argv){
	if (argc==2 && strcmp(argv[1],"--one-line-help")==0){
		printf("Executes a restricted shell\n");
		return 0;
	}
#ifdef DEFAULT_COMMANDS_PATH
	setenv(COMMANDS_PATH, DEFAULT_COMMANDS_PATH, 1);
#else
	setenv(COMMANDS_PATH, getenv("PATH"), 1);
#endif
	
	// Must be set at COMMANDS_NAME envvar.
	commands_name=getenv("COMMANDS_NAME");
	if (!commands_name){
		char *tmp;
#ifdef COMMAND_NAME
		tmp=strdup(COMMAND_NAME);
#else
		tmp=strdup(argv[0]);
#endif
		
		commands_name=strdup(basename(tmp));
		free(tmp);
		// Use first part of my own name
		char *dash=strchr(commands_name,'-');
		if (dash)
			*dash=0;
	}
	else
		commands_name=strdup(commands_name);
	commands_name_length=strlen(commands_name);
	commands_config_parse();
	
	update_allowed_commands();

	if (argc>1){ // May set one command as arguments.
		commands_run(argv[1], argc-1, argv+1);
		exit(0);
	}
	
	int running=1;
	char line[2048];
	memset(line, 0, sizeof(line));
	char *margv[256];
	unsigned long n=1;
	while(running){
		printf("%s:%ld> ", commands_name, n++);
		fflush(stdout);
		
		memset(line, 0, sizeof(line));
		if ( !fgets(line, sizeof(line), stdin) ){
			running=0;
			break;
		}
		if (!strchr(line,'\0')){
			fprintf(stderr,"Statement too long. Ignoring.");
		}
		else{
			char *I=line, *endI=line+strnlen(line, sizeof(line))-1;
			*(endI)=0;
			int margc=1;
			margv[0]=I;
			for(;I!=endI && *I;++I){
				if (isspace(*I)){
					*I++=0;
					while (isspace(*I)) ++I;
					margv[margc++]=I;
				}
			}
			margv[margc]=NULL;
			if (strcmp(margv[0],"exit")==0){
				printf("Bye.\n");
				running=0;
			}
			else
				commands_run_no_exec(margv[0], margc, margv);
		}
	}
	printf("\n");
	subcommand_list_free();
	free(commands_name);
	return 0;
}
