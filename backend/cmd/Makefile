all:
	@echo "test -- runs all test, coverage and generates html"

test:
	coverage-3.4 run serverboards.py --test
	coverage-3.4 html
	coverage-3.4 report
	@echo
	@echo "HTML at htmlcov/ directory"
