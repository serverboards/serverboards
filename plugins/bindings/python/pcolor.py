import sys


def printc(*s, color="grey", hl=None, bg=None, file=sys.stderr):
    """
    Prints some text with some color, using Terminal escape sequences

    >>> printc("Hello world", color="blue")
    \033[1;34mHello world\033[1;m
    >>> printc("Hello world", color="blue", hl=True)
    \033[1;44mHello world\033[1;m

    """
    colors = {
        'grey': 30,
        'black': 31,
        'red': 31,
        'green': 32,
        'yellow': 33,
        'blue': 34,
        'magenta': 35,
        'purple': 35,
        'cyan': 36,
    }
    if color == "grey":
        hl = True
    code = colors.get(color)
    text = ' '.join(str(x) for x in s)
    if code:
        hl = 1 if hl else 0
        if bg:
            code += 10
        file.write("\r\033[{hl};{color}m{text}\033[1;m\n".format(
            hl=hl, text=text, color=code))
    else:
        file.write(text + '\n')
    file.flush()
