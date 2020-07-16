import _ from 'lodash';
import IssueLib from './issue';
import MergeRequestLib from './mergeRequest';
import Moment from 'moment-timezone';
import Logger from '../logger';
import { getData } from '../localstorage';

const LABEL_CONFIG = [
  { name: 'breaking change', title: 'Notable changes' },
  { name: 'enhancement', title: 'Enhancements' },
  { name: 'feature', title: 'New features' },
  { name: 'bug', title: 'Fixed bugs' },
];

const _createLabelBucket = () => {
  const labelBucket = { issues: [], mergeRequests: [] };
  for (const labelConfigItem of LABEL_CONFIG) {
    labelBucket[labelConfigItem.name] = [];
  }
  return labelBucket;
};

const _populateIssuesWithBucketByIssue = (bucket, issues, options = {}) => {
  for (const issue of issues) {
    let added = false;
    for (const label of issue.labels || []) {
      if (_.has(bucket, label)) {
        bucket[label].push(IssueLib.decorateIssue(issue, options));
        added = true;
      }
    }
    if (!added) bucket.issues.push(IssueLib.decorateIssue(issue, options));
  }
  return bucket;
};

const _populateMergeRequestsWithBucketByMergeRequests = (
  bucket,
  mergeRequests,
  options = {},
) => {
  for (const mergeRequest of mergeRequests) {
    let added = false;
    for (const label of mergeRequest.labels || []) {
      if (_.has(bucket, label)) {
        bucket[label].push(
          MergeRequestLib.decorateMergeRequest(mergeRequest, options),
        );
        added = true;
      }
    }
    if (!added)
      bucket.mergeRequests.push(
        MergeRequestLib.decorateMergeRequest(mergeRequest, options),
      );
  }
  return bucket;
};

const generateChangeLogContent = async (
  { releaseDate, issues, mergeRequests },
  options = {},
) => {
  // Separate by labels
  let changelogBucket = _createLabelBucket();

  _populateIssuesWithBucketByIssue(changelogBucket, issues, options);

  _populateMergeRequestsWithBucketByMergeRequests(
    changelogBucket,
    mergeRequests,
    options,
  );
  const { timeZone } = getData();

  const labelConfigs = [
    ...LABEL_CONFIG,
    // { name: "issues", title: "Closed issues", default: true },
    { name: 'closed', title: 'Closed issues', default: true },
    { name: 'mergeRequests', title: 'Merged merge requests', default: true },
  ];
  if (options.useSlack) {
    let changelogContent = `*Release note (${Moment.tz(
      releaseDate,
      timeZone,
    ).format('YYYY-MM-DD')})*\n`;
    for (const labelConfig of labelConfigs) {
      if (changelogBucket[labelConfig.name]) {
        changelogContent += `*${labelConfig.title}*\n`;
        changelogContent += changelogBucket[labelConfig.name].join('\n');
      }
    }
    return changelogContent;
  } else {
    let changelogContent = `### Release note (${Moment.tz(
      releaseDate,
      timeZone,
    ).format('YYYY-MM-DD')})\n`;
    for (const labelConfig of labelConfigs) {
      if (changelogBucket[labelConfig.name]) {
        if (
          !_.isEmpty(changelogBucket[labelConfig.name]) ||
          labelConfig.default
        ) {
          changelogContent += `#### ${labelConfig.title}\n`;
          if (!_.isEmpty(changelogBucket[labelConfig.name]))
            changelogContent +=
              changelogBucket[labelConfig.name].join('\n') + '\n';
        }
      }
    }
    return changelogContent;
  }
};
const getChangelogByStartAndEndDate = async (
  startDate,
  endDate,
  options = {},
) => {
  const { projectId, timeZone } = getData();
  Logger.info(
    `Time range that we are looking at MRs and issues is between ${Moment.tz(
      startDate,
      timeZone,
    )} and ${Moment.tz(endDate, timeZone)}`,
  );
  const mergeRequests = await MergeRequestLib.getMergeRequestByProjectIdStateStartDateAndEndDate(
    projectId,
    'merged',
    startDate,
    endDate,
  );
  Logger.info(
    `Found ${mergeRequests ? mergeRequests.length : 0} merge requests`,
  );
  const issues = await IssueLib.searchIssuesByProjectIdStateStartDateAndEndDate(
    projectId,
    'closed',
    startDate,
    endDate,
  );
  Logger.info(`Found ${issues ? issues.length : 0} issues`);
  return {
    mergeRequests,
    issues,
    releaseDate: endDate,
  };
};

export default {
  generateChangeLogContent,
  getChangelogByStartAndEndDate,
};
