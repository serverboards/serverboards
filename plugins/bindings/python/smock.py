import json
import yaml

"""
SMock -- Serverboards Mock library -- Mock comfortably.

This library helps to mock function and method calls, getting the data
from an external yaml file.
"""


class MockWrapper:
    """
    Wraps all the data returned by the mocked function to behave like a
    dictionary, like an object, like a function... like almost everything you
    may need
    """
    def __init__(self, data):
        self.__data = data

    def __getattr__(self, key):
        if key not in self.__data:
            raise KeyError("'%s' not found in %s" % (key, self.__data.keys()))
        return MockWrapper(self.__data[key])

    def __call__(self):
        return MockWrapper(self.__data)

    def __getitem__(self, key):
        return MockWrapper(self.__data[key])

    def __str__(self):
        return str(self.__data)

    def __repr__(self):
        return repr(self.__data)

    def __eq__(self, other):
        return self.__data.__eq__(other)

    def __le__(self, other):
        return self.__data.__le__(other)

    def __ge__(self, other):
        return self.__data.__ge__(other)

    def __lt__(self, other):
        return self.__data.__lt__(other)

    def __gt__(self, other):
        return self.__data.__gt__(other)

    def __len__(self):
        return self.__data.__len__()

    def keys(self):
        return self.__data.keys()

    def get(self, key, defv=None):
        return self.__data.get(key, defv)


def mock_match(A, B):
    """
    Checked for params on a mocked function is as expected

    It is necesary as sometimes we get a tuple and at the mock data we have
    lists.

    Examples:
    ```
    >>> mock_match("A", "A")
    True
    >>> mock_match("A", "B")
    False
    >>> mock_match(["A", "B", "C"], ["A", "B", "C"])
    True
    >>> mock_match(["A", "B", "C"], "*")
    True

    ```
    """
    if B == '*':  # always match
        return True
    if isinstance(A, (tuple, list)):
        return all(mock_match(a, b) for (a, b) in zip(A, B))
    return A == B


def mock_res(name, data, args=[], kwargs={}):
    """
    Given a name, data and call parameters, returns the mocked response

    If there is no matching response, raises an exception that can be used to
    prepare the mock data.

    This can be used for situations where you mock some function like data;
    for example at [Serverboards](https://serverboards.io), we use it to
    mock RPC calls.

    Its also used internally on every other mocking.
    """
    data = data.get(name)
    if not data:
        raise Exception(
            "unknown method for mocking: %s(%s, %s)" % (
                name, json.dumps(args), json.dumps(kwargs)
            )
        )
    for res in data:
        if (mock_match(args, res.get("args")) and
                mock_match(kwargs, res.get("kwargs", {}))):
            return MockWrapper(res["response"])
    raise Exception(
        "unknown data for mocking: %s(%s, %s)" % (
            name, json.dumps(args), json.dumps(kwargs)
        )
    )


def mock_method(name, data):
    """
    Returns a function that mocks an original function.
    """
    def mockf(*args, **kwargs):
        return mock_res(name, data, args, kwargs)
    return mockf


def mock_method_async(name, data):
    """
    Returns an async function that mocks an original async function
    """
    async def mockf(*args, **kwargs):
        return mock_res(name, data, args, kwargs)
    return mockf


class SMock:
    """
    Encapsulates mocking calls so it's easier to load data and mock methods

    Example:

    ```python
    >>> import requests
    >>> smocked = SMock("tests/data.yaml")
    >>> requests.get = smocked.mock_method("requests.get")
    >>> res = requests.get("https://mocked.url")
    >>> res.status_code
    200
    >>> res.content
    'Gocha!'
    >>> res.json()
    {'text': 'Gocha too!'}

    ```

    The mock file is a yaml file with each mocked function as keys, and
    `args`/`kwargs` as calling args and kwargs, and `response` the response.

    Check `tests/data.yaml` for an example at the source code.
    """
    def __init__(self, mockfile):
        with open(mockfile) as fd:
            self._data = yaml.load(fd)

    def mock_res(self, name, args=[], kwargs={}):
        """
        Calls `mock_res`

        Mock by args:
        ```
        >>> smock = SMock("tests/data.yaml")
        >>> res = smock.mock_res("requests.get", ["https://mocked.url"])
        >>> res.status_code
        200

        ```

        Using "*" as args, as fallback. As there is no kwargs, use default:
        ```
        >>> res = smock.mock_res("requests.get", ["https://error.mocked.url"])
        >>> res.status_code
        404

        ```

        Using "*" as kwargs:
        ```
        >>> res = smock.mock_res("requests.get",
        ...         ["https://mocked.url"],
        ...         {'data': 'data'})
        >>> res.status_code
        200
        >>> res.content
        'Mocked query'

        ```
        """
        return mock_res(name, self._data, args, kwargs)

    def mock_method(self, name):
        """
        Calls `mock_method`
        """
        return mock_method(name, self._data)

    async def mock_method_async(self, name):
        """
        Calls `mock_method_async`
        """
        return await mock_method_async(name, self._data)


if __name__ == '__main__':
    print("Testing smock...")
    import doctest
    import sys
    res = doctest.testmod()
    if not res.failed:
        print("Done:", res)
    else:
        print("Failed:", res)
    sys.exit(res.failed)
