#!/usr/bin/python3

__doc__ = """s10s user -- User and group management
Last resort user management.

This commands change the database manually, and should be used on the
specific occasions that the UI can not be used, as first time use.

For normal user management use the UI or request the feature at
https://forum.serverboards.io.

User management:
    s10s user list            -- Lists all known user emails
    s10s user details <email> -- Show user details in yaml format
    s10s user create <email>  -- Creates the given user. User must ask for a email reset using the UI.
    s10s user enable <email>  -- Disables the user
    s10s user recover <email> -- Sends the recover email for the given user
    s10s user passwd <email>  -- Asks for new password for the given user
    s10s user disable <email> -- Disables the user
    s10s user add <email> to <group>      -- Adds the user to the group
    s10s user remove <email> from <group> -- Removes the user to the group
"""


import sys
import os
import configparser
import psycopg2
import datetime
import json
import glob
import socket
import time
conn = None


class ServerboardsDB():

    def __init__(self):
        url = self.get_url()

        import urllib.parse  # import urllib.parse for python 3+
        result = urllib.parse.urlparse(url)
        connection = psycopg2.connect(
            database=result.path[1:],
            user=result.username,
            password=result.password,
            host=result.hostname
        )

        self.connection = connection

    @staticmethod
    def get_url():
        url = os.environ.get("SERVERBOARDS_DATABASE_URL")
        if url:
            return url
        inis = [
            *glob.glob("/etc/serverboards/*.ini"),
            "/etc/serverboards.ini",
            os.environ.get("SERVERBOARDS_INI", "")
        ]
        for ini in inis:
            if not os.path.exists(ini):
                # print("Could not open %s" % ini)
                continue
            try:
                config = configparser.ConfigParser(allow_no_value=True)
                config.read(ini)
                url = config.get("database", "url")
                if url[0] == '"' and url[-1] == '"':
                    url = url[1:-1]
                return url
            except Exception:
                pass
        print("""Could not read any of [%s] settings file.
Please ensure you have the proper permissions to access that file and
that it is well formed.""" % ', '.join(inis))
        sys.exit(1)

    def execute(self, sql, *args):
        cur = self.connection.cursor()
        cur.execute(sql, args)
        return cur.fetchall()

    def insert(self, sql, *args):
        cur = self.connection.cursor()
        cur.execute(sql, args)
        self.connection.commit()


def log(*txt, **kwargs):
    text = ' '.join(str(x) for x in txt)
    print("WARN: %s" % text, file=sys.stderr)
    conn.insert("""
        INSERT INTO logger_line (message, level, timestamp, meta)
             VALUES (%s, 'warn', NOW(), %s)
         """, text, json.dumps({**kwargs, "cli": True})
                )


def list_():
    for user in conn.execute("SELECT email FROM auth_user;"):
        print("- %s" % (user[0]))


def details(email):
    data = conn.execute(
        "SELECT email, name, is_active, inserted_at FROM auth_user WHERE email = %s;",
        email
    )
    if not data:
        print("unknown user")
        return
    groups = conn.execute("""
        SELECT ag.name from auth_group ag
        INNER JOIN auth_user_group agu ON ag.id = agu.group_id
        INNER JOIN auth_user au ON au.id = agu.user_id
        """)
    data = data[0]
    print("email: %s\nname: %s\nis_active: %s\ninserted_at: %s" % data)
    if not groups:
        print("groups: []")
    else:
        print("groups:")
        for g in groups:
            print(" - %s" % g[0])


def add_user_to_group(user, group):
    if not user_at_group(user, group):
        user_id = conn.execute("SELECT id FROM auth_user WHERE email = %s", user)[0]
        group_id = conn.execute("SELECT id FROM auth_group WHERE name = %s", group)[0]

        conn.insert(
            "INSERT INTO auth_user_group (group_id, user_id) VALUES (%s, %s)",
            group_id, user_id
        )
        log("Manually added user %s to %s" % (user, group), user=user, group=group)
        print("added")
    else:
        print("user already at group")


def remove_user_from_group(user, group):
    if user_at_group(user, group):
        conn.insert("""
            DELETE FROM auth_user_group
                  WHERE user_id = (SELECT id FROM auth_user WHERE email = %s)
                    AND group_id = (SELECT id FROM auth_group WHERE name = %s)
            """, user, group )
        log("Manually removed user %s from %s" % (user, group), user=user, group=group)
        print("removed")
    else:
        print("user not in group")


def user_at_group(name, group):
    ngroups = conn.execute("""
        SELECT count(*) from auth_group ag
        INNER JOIN auth_user_group agu ON ag.id = agu.group_id
        INNER JOIN auth_user au ON au.id = agu.user_id
        WHERE au.email = %s
          AND ag.name = %s
        """, name, group)[0][0]
    return ngroups > 0


def create(email):
    now = datetime.datetime.now()

    try:
        conn.insert(
            "INSERT INTO auth_user (email, is_active, inserted_at, updated_at) VALUES (%s, True, %s, %s)",
            email, now, now
        )
        log("Manually created user %s" % (email), user=email)
        print("inserted")
    except psycopg2.IntegrityError:
        print("error: user already exists")


def update_enabled(email, is_active):
    conn.insert(
        "UPDATE auth_user SET is_active = %s WHERE email = %s",
        is_active, email
    )
    log("Manually enabled user %s (%s)" % (email, str(is_active)), user=email, is_active=is_active)
    print("updated")


class TCPClient:

    def __init__(self, host, port):
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect((host, int(port)))
        self.socket = s
        self.max_id = 0
        time.sleep(1)

    def call(self, f, *args, **kwargs):
        self.max_id += 1
        js = json.dumps({
            "method": f,
            "params": args or kwargs,
            "id": self.max_id
        })
        self.socket.send(js.encode('utf8') + b'\n')
        id = None
        while id != self.max_id:
            res = self.socket.recv(4096)
            js = json.loads(res.decode('utf8'))
            id = ('result' in js or 'error' in js) and (js.get("id"))
        if js.get("error"):
            raise Exception(js.get("result"))
        return json.dumps(js.get("result"))


def recover(email):
    conn = TCPClient("localhost", "4040")
    print(conn.call("auth.reset_password", email))


def passwd(email, raw_password):
    import bcrypt
    if not raw_password:
        import getpass
        print("This is an insecure practice.\nPassword should only be known by the final user.\nThe recomended practice is to use the UI to request a password reset.\nUse only for exceptional cases.")
        try:
            raw_password = getpass.getpass()
            if not raw_password:
                print("No password provided. Use `s10s recover %s` to send a recover link to the user" % (email))
                sys.exit(1)
            if raw_password != getpass.getpass("Repeat password: "):
                print("Password dont match!")
                sys.exit(2)
        except KeyboardInterrupt:
            print()
            sys.exit(0)
    salt = bcrypt.gensalt()
    pwhash = bcrypt.hashpw(raw_password.encode('utf8'), salt)
    password = "$bcrypt$%s" % pwhash.decode('utf8')
    user_id = conn.execute("SELECT id FROM auth_user WHERE email = %s", email)
    if not user_id:
        sys.exit(1)
    user_id = user_id[0]
    now = datetime.datetime.now()
    if conn.execute("SELECT id FROM auth_user_password WHERE user_id = %s", user_id):
        conn.insert(
            "UPDATE auth_user_password SET password = %s, updated_at = %s WHERE user_id = %s", password, now, user_id)
    else:
        conn.insert("INSERT INTO auth_user_password (password, user_id, inserted_at, updated_at) VALUES (%s, %s, %s, %s)",
                    password, user_id, now, now)
    log("Password for <%s> has been manually updated" % email)


def main(argv):
    if '--one-line-help' in argv:
        print("User management")
        sys.exit(0)
    if len(argv) == 1 or '--help' in argv or 'help' in argv:
        print(__doc__)
        sys.exit(0)

    global conn
    conn = ServerboardsDB()

    if argv[1] == "list":
        list_()
    elif argv[1] == "details":
        details(argv[2])
    elif argv[1] == "create":
        create(argv[2])
    elif argv[1] == "enable":
        update_enabled(argv[2], True)
    elif argv[1] == "disable":
        update_enabled(argv[2], False)
    elif argv[1] == "recover":
        recover(argv[2])
    elif argv[1] == "passwd":
        passwd(argv[2], (len(argv) >= 4) and argv[3])
    elif argv[1] == "password":
        passwd(argv[2], (len(argv) >= 4) and argv[3])
    elif argv[1] == "add" and argv[3] == "to":
        add_user_to_group(argv[2], argv[4])
    elif argv[1] == "remove" and argv[3] == "from":
        remove_user_from_group(argv[2], argv[4])
    else:
        print("unknown command")

if __name__ == '__main__':
    main(sys.argv)
