import coverage

_cov = None

def before_all(context):
    # behave-django initialise Django pour toi
    global _cov
    _cov = coverage.Coverage()
    _cov.start()

def after_all(context):
    global _cov
    if _cov:
        _cov.stop()
        _cov.save()
        _cov.report()
        _cov.html_report()