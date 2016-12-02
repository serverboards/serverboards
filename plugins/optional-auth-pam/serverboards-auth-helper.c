// Under Apache2 License. Check https://serverboards.io/license/
// (C) 2016 David Moreno Montero <dmoreno@serverboards.io>

#include <stdbool.h>
#include <security/pam_appl.h>
#include <security/pam_misc.h>

#define PAM_SERVICE_NAME "serverboards"

// Reads a line in a new buffer. 
char *read_line();
bool check_username_and_password(const char *username, const char *password);

// Based on the idea of pwauth used by apache2 pam mod.
// https://github.com/phokz/pwauth/blob/master/pwauth/auth_pam.c
//
// It reads one line with the user name, another with the password, 
// and returns 0 for ok, 1 for fail.
//
// It should be SUID or it will only authenticate the current user
int main(int argc, char **argv){
	// Fast and loose, do not free any memory
	char *username = read_line();
	char *password = read_line();

	return (check_username_and_password(username, password) == true) ? 0 : 1;
}


char *read_line(){
	char *line=NULL;
	size_t l=0;
	ssize_t r = getline(&line, &l, stdin); 
	if (r < 0){
		fprintf(stderr, "Error reading from stdin");
		return NULL;
	}
	line[r-1]=0; // Remove ending \n
	return line;
}

int conversation(int num, const struct pam_message **msg, struct pam_response **resp, void *password){
	if ((num != 1) || (strcmp(msg[0]->msg, "Password: ")!=0) || (msg[0]->msg_style!=PAM_PROMPT_ECHO_OFF)){
		return PAM_CONV_ERR;
	}
	resp[0]=calloc(1, sizeof(struct pam_response));
	resp[0]->resp=password;
	resp[0]->resp_retcode=0;

	return PAM_SUCCESS;
}

bool check_username_and_password(const char *username, const char *password){
	struct pam_conv conv = {
		conversation,
		(void*)password
	};

	pam_handle_t *pamh=NULL;
	int retval;
	
	retval = pam_start(PAM_SERVICE_NAME, username, &conv, &pamh);

	if (retval == PAM_SUCCESS)
		retval = pam_authenticate(pamh, 0);
	if (retval == PAM_SUCCESS)
		retval = pam_acct_mgmt(pamh, 0);

	bool success = retval == PAM_SUCCESS;

	pam_end(pamh, retval);

	return success;
}

