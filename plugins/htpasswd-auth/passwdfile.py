import hashlib, os, base64, tempfile, shutil

class PasswdFile:
    """
    Manages a Password file with the format:

        # comment
        email@domain.com:$hashname$salt$hash
        email2@domain.com:$hashname$salt$hash

    Example of use:

        >>> os.unlink("/tmp/htishpasswd")

        >>> pwf = PasswdFile("/tmp/htishpasswd")
        >>> pwf.update("dmoreno@coralbits.com", "1234")
        >>> print( pwf.check("dmoreno@coralbits.com", "1234") )
        True

        >>> pwf = PasswdFile("/tmp/htishpasswd")
        >>> print( pwf.check("dmoreno@coralbits.com", "12345") )
        False

        >>> pwf = PasswdFile("/tmp/htishpasswd")
        >>> pwf.update("dmoreno1@coralbits.com", "12345")
        >>> pwf.update("dmoreno2@coralbits.com", "12345")
        >>> print( pwf.check("dmoreno@coralbits.com", "12345") )
        False
        >>> print( pwf.check("dmoreno2@coralbits.com", "12345") )
        True
        >>> pwf.update("dmoreno@coralbits.com", "12345")
        >>> print( pwf.check("dmoreno@coralbits.com", "12345") )
        True

        >>> pwf = PasswdFile("/tmp/htishpasswd")
        >>> print( pwf.check("dmoreno@coralbits.com", "12345") )
        True

    User can also use comments that should be kept in place

        >>> fd = open("/tmp/htishpasswd",'a')
        >>> fd.write("# comment\\n")
        >>> fd.close()
        >>> pwf = PasswdFile("/tmp/htishpasswd")
        >>> pwf.update("dmorenoc@coralbits.com", "12")
        >>> print( "\\n# comment\\ndmorenoc@" in open("/tmp/htishpasswd").read() )
        True

    Some characters are not allowed in emails: $#

        >>> pwf = PasswdFile("/tmp/htishpasswd")
        >>> pwf.update("dmoren#oc@coralbits.com", "12")
        Traceback (most recent call last):
            ...
        Exception: Invalid characters at email
        >>> pwf.update("$dmorenoc@coralbits.com", "12")
        Traceback (most recent call last):
            ...
        Exception: Invalid characters at email

    User can set new modes at update:

        >>> pwf = PasswdFile("/tmp/htishpasswd")
        >>> pwf.update("dmoreno@coralbits.com", "123456 sha", mode='sha1')
        >>> print( pwf.check("dmoreno@coralbits.com", "12345") )
        False
        >>> print( pwf.check("dmoreno@coralbits.com", "123456 sha") )
        True

    """
    def __init__(self, filename):
        self.filename=filename
        if not os.path.exists(filename):
            with open(filename,'w') as w: # touch it.
                pass

    def __enter__(self):
        return self
    def __exit__(self, type, value, traceback):
        if self.updated:
            pass
    def check(self, email, passwd):
        assert not ':' in email
        with open(self.filename) as fd:
            email_colon=email+':'
            for x in fd:
                if x.startswith(email_colon):
                    return self.check_password_match(x[len(email_colon):], passwd)
        return False

    def update(self, email, passwd, mode='sha512'):
        if '#' in email or '$' in email:
            raise Exception("Invalid characters at email")

        salt=os.urandom(9)
        hashed_passwd=PasswdFile.__hash(mode, salt, email, passwd)

        hashed_passwd = "%s$%s$%s"%(
            mode,
            base64.b64encode(salt),
            base64.b64encode(hashed_passwd)
            )
        done=False
        email_colon=email+':'
        try:
            wfd_filename=tempfile.mkstemp()
            tempfilename=wfd_filename[1]
            with os.fdopen(wfd_filename[0],'w') as wfd:
                with open(self.filename, 'r') as rfd:
                    for l in rfd:
                        if l.startswith(email_colon):
                            wfd.write(email_colon + hashed_passwd + '\n')
                            done=True
                        else:
                            wfd.write(l)
                    if not done:
                        wfd.write(email_colon + hashed_passwd + '\n')
            shutil.move(tempfilename, self.filename)
        except Exception as e:
            os.unlink(tempfilename)
            raise

    def list(self):
        with open(self.filename, 'r') as rfd:
            for l in rfd:
                if l.startswith('#'):
                    continue
                yield l.split(':')[0]

    def check(self, email, passwd):
        email_colon=email+':'
        with open(self.filename, 'r') as rfd:
            for l in rfd:
                if l.startswith(email_colon):
                    mode, salt, hashed = l[len(email_colon):].split('$')
                    salt=base64.b64decode(salt)
                    hashed=base64.b64decode(hashed)
                    return hashed == PasswdFile.__hash(mode, salt, email, passwd)
        return False

    @staticmethod
    def __hash(mode, salt, email, passwd):
        h=hashlib.new(mode)
        assert h
        h.update(salt)
        h.update(email)
        h.update(passwd)
        return h.digest()
