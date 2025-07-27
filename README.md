This project is a sample Node.js automation framework using Mocha for testing. It includes both UI automation tests and integration tests, which are organized under the test/ directory.

Installation: Install Node.js (latest stable version) Download Node.js – NPM comes bundled with Node.js.

Clone the repository:

git clone https://github.com/Manisampleproject/TestProject.git 

Install dependencies

npm install

Test Structure: All test files are located under the test/ directory.

Test files follow the naming pattern: *.test.js.

Testing Libraries Used Mocha – Test runner

Chai – Assertion library

Assert – Node.js built-in assertion

got – HTTP request library

Make sure all dependencies are properly installed using npm install.

Running Tests Set up the test script in package.json:

"scripts": { "test": "mocha test/**/*.test.js" }

Run Tests:

npm test or npm run test

CI/CD Integration: A GitHub Actions workflow is configured for Continuous Integration. Every time code is pushed to the repository, the pipeline is triggered automatically.

View workflow status here: CI Pipeline – Node.js

Performance Testing: 
This project uses Artillery for performance testing.

Installation:

npm install -g artillery Performance Test Files: All performance tests are located in the performancetest/ directory.

Run a Performance Test:

artillery run performancetest/loadTest.yml -o performancetest/report.json Generate HTML Report: artillery report performancetest/report.json -o performancetest/report.html


Datadog Integration:

- Integration with [Datadog](https://www.datadoghq.com/) for observability
- Logging of pipeline results into datadog
