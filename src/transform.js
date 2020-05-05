const ld = require('lodash');

const calcStats = tests => {
  const total = tests.length;
  const failure = tests.filter(x => x.failed).length;
  const passed = total - failure;
  return { total, failure, passed };
};

const getTests = (tests, report) => (tests = report ? report.tests : tests);

const metaDataPerPush = ({ _id, report, commit, timestamp, tests, stats }) => {
  tests = getTests(tests, report);
  const { author } = commit;
  const name = author.name || author.username;
  stats = stats ? stats : calcStats(tests);
  stats.percent = (stats.passed / stats.total) * 100;
  return { _id, timestamp, name, stats };
};

const testDetailsPerPush = data => {
  let { tests, report } = data;
  tests = getTests(tests, report);
  const meta = metaDataPerPush(data);
  return tests.map(test => {
    delete test.timeStamp;
    delete test.sTrace;
    delete test.runnerName;
    test.testName = test.testName.replace(/^test_/, '');
    return Object.assign(test, meta);
  });
};

const getMetaSummaryPerPush = data => ld.flatMap(data, metaDataPerPush);
const getTestSummaryPerPush = data => ld.flatMap(data, testDetailsPerPush);
const getLatestPushSummary = data => {
  const groups = ld.groupBy(
    data,
    x => x.commit.author.name || x.commit.author.username
  );
  const subset = ld.flatMap(groups, (details, _) => {
    let timeStampGroups = ld.groupBy(details, 'timestamp');
    const latestTime = ld.max(Object.keys(timeStampGroups));
    return timeStampGroups[latestTime];
  });
  return getTestSummaryPerPush(subset);
};

const getPassPercent = data => {
  const testSummaryPerPush = getLatestPushSummary(data);
  const groups = ld.groupBy(testSummaryPerPush, 'name');
  const passPercentages = ld.map(groups, (testResults, _) => testResults[0]);
  return passPercentages.map(({ name, _id, timestamp, stats }) => {
    return { name, _id, timestamp, percent: stats.percent };
  });
};

module.exports = {
  getMetaSummaryPerPush,
  getTestSummaryPerPush,
  getLatestPushSummary,
  getPassPercent
};
