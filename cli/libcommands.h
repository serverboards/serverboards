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

#pragma once

struct subcommand_list_t;
typedef struct subcommand_list_t subcommand_list_t;

typedef enum{
	SC_EXTERNAL, ///< Exec a external command
	SC_INTERNAL, ///< Call a internal function, do next.
	SC_INTERNAL_1, ///< Call a internal function with an argument, do next.
	SC_EXPORT_ENV, ///< Export an environment and do next.
	SC_INTERNAL_ARGS, ///< Call an internal function with arguments.
	
	SC_NOHELP=64, ///< Do not show help for this command.
	SC_BLACKLISTED=SC_NOHELP | 128, ///< Blacklisted flag. Commands blacklisted can not be run. These command do not show help.
	
	SC_TYPE_MASK=~SC_NOHELP,
}subcommand_type_e;

typedef struct subcommand_t{
	char *name;
	subcommand_type_e type;
	union{
		char *fullpath;
		void (*f)();
		int (*f_with_args)(int argc, char **argv);
		struct{
			void (*f_with_data)();
			void *f_data;
		};
		struct{
			char *env_name;
			char *env_value; ///< Set to NULL to export the arguments argument. --export=value
		};
	};
	char *one_line_help;
}subcommand_t;

int commands_main(int argc, char **argv);
int commands_run(const char *subcommand, int argc, char **argv);
int commands_which(int argc, char **argv);
void commands_list();
void commands_help();
void commands_debug();
void commands_config_parse();

subcommand_t *subcommand_find(const char *name);
subcommand_t *subcommand_list_end();
subcommand_t *subcommand_list_begin();
subcommand_t *subcommand_list_add(subcommand_t *command);
void subcommand_list_free();
void subcommand_list_init();

extern char *commands_name;
extern unsigned int commands_name_length;
extern const char *COMMANDS_PATH;
