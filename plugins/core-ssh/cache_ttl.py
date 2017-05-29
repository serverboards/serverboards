import time

def __identity(*args, **kwargs):
    return args or kwargs

def cache_ttl(ttl=10, maxsize=50, hashf=__identity):
    """
    Simple decorator, not very efficient, for a time based cache.

    Params:
        ttl -- seconds this entry may live. After this time, next use is evicted.
        maxsize -- If trying to add more than maxsize elements, older will be evicted.
        hashf -- Hash function for the arguments. Defaults to same data as keys, but may require customization.

    """
    def wrapper(f):
        data = {}
        def wrapped(*args, **kwargs):
            nonlocal data
            currentt = time.time()
            if len(data)>=maxsize:
                # first take out all expired
                data = { k:(timeout,v) for k,(timeout, v) in data.items() if timeout>currentt }
                if len(data)>=maxsize:
                    # not enough, expire oldest
                    oldest_k=None
                    oldest_t=currentt+ttl
                    for k,(timeout,v) in data.items():
                        if timeout<oldest_t:
                            oldest_k=k
                            oldest_t=timeout

                    del data[oldest_k]
            assert len(data)<maxsize

            if not args and not kwargs:
                hs = None
            else:
                hs = hashf(*args, **kwargs)
            timeout, value = data.get(hs, (currentt, None))
            if timeout<=currentt or not value:
                # recalculate
                value = f(*args, **kwargs)
                # store
                data[hs]=(currentt + ttl, value)
            return value
        return wrapped
    return wrapper
