import _ from 'lodash';
import writeFile from 'js-file-download';
import Moment from 'moment-timezone';
// import IssueLib from './issue';
// import MergeRequestLib from './mergeRequest';
import TagLib from '../lib/tag';
import ChangelogLib from '../lib/changelog';
// import Logger from '../logger';
import { getData } from '../localstorage';

const generateReleaseNotes = async () => {
  const { projectId, timeZone, issueCloseSecond } = getData();
  const tags = await TagLib.getLatestAndSecondLatestTagByProjectId(projectId);
  console.log(tags);
  if (tags.length !== 2)
    throw new Error(
      'Cannot find latest and second latest tag. Tag Result: ' +
        JSON.stringify(tags),
    );
  let [latestTag, secondLatestTag] = tags;
  // CHEATING: Comment below only used when no tags (haven't released before)
  // if (!latestTag) {
  //   latestTag = { name: '0.0.1' };
  // }
  if (!secondLatestTag) {
    secondLatestTag = { name: '0.0.2' };
  }

  // CHEATING: Comment line below when no tags (haven't released before)
  if (
    !_.get(latestTag, 'commit.committed_date') ||
    !_.get(secondLatestTag, 'commit.committed_date')
  )
    throw new Error(
      `Cannot find latest and second latest tag. Abort the program!`,
    );
  // const startDate = _.get(secondLatestTag, 'commit.committed_date');
  // let endDate = _.get(latestTag, 'commit.committed_date');
  const startDate = _.get(latestTag, 'commit.committed_date');
  let endDate = new Date(Date.now()).toISOString();
  console.log('startDate', startDate);
  console.log('endDate', endDate);

  // allow the end date to be adjusted by a few seconds to catch issues that are automatially closed by
  // a MR and are time stamped a few seconds later.
  if (issueCloseSecond > 0) {
    // Logger.debug(`EndDate:        ${endDate}`);
    // Logger.debug(`Adding Seconds: ${issueCloseSecond}`);
    endDate = Moment.tz(endDate, timeZone)
      .add(issueCloseSecond, 'seconds')
      .utc()
      .format();
    // Logger.debug(`New End Date:   ${endDate}`);
  }

  const changeLog = await ChangelogLib.getChangelogByStartAndEndDate(
    startDate,
    endDate,
  );
  // console.log(changeLogContent);
  // writeFile(JSON.stringify(changeLog, {}, 2), 'changeLog.txt');

  const changeLogContent = await ChangelogLib.generateChangeLogContent(
    changeLog,
    { useSlack: false },
  );
  // console.log(changeLogContent);
  writeFile(changeLogContent, 'release.md');

  // Logger.debug(`Changelog: ${changeLogContent}`);
  // return await TagLib.upsertTagDescriptionByProjectIdAndTag(projectId, latestTag, changeLogContent);
};

export default generateReleaseNotes;
