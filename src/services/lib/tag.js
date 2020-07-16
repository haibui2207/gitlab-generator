import _ from 'lodash';
import Gitlab from '../adapters/gitlab';
import Logger from '../logger';
import Commit from './commit';
import { getData } from '../localstorage';

const isBranchesInTargetBranch = (branches, targetBranchName) => {
  if (!targetBranchName) return true;
  return _.some(branches, (branch) => branch.name === targetBranchName);
};

const isTagsMatchTargetTagRegex = (tags, targetTagRegex) => {
  if (!targetTagRegex) return true;
  return _.some(tags, (tag) => _.get(tag, 'name', '').match(targetTagRegex));
};

const getLatestAndSecondLatestTagByProjectId = async (projectId) => {
  const { targetBranch, tagRegex } = getData();
  let { tags, _link } = await Gitlab.searchTagsByProjectId(projectId);

  if (_.isEmpty(tags)) return [];

  const latestTag = tags.shift();
  Logger.info(`Latest tag is ${latestTag.name}`);

  if (tags.length === 0) {
    const project = await Gitlab.getRepoByProjectId(projectId);
    console.log(project);

    Logger.info('No more tags is found');
    return [latestTag, { commit: { committed_date: project.created_at } }];
  } else {
    // TODO
    let secondLatestTag = null;
    let page = 0;

    if (!isTagsMatchTargetTagRegex([latestTag], tagRegex))
      throw new Error(
        `Latest tag doesn't match with the regex. Target tag regex ${tagRegex}`,
      );
    const latestBranches = await Commit.findBranchRefsByProjectIdAndSha(
      projectId,
      _.get(latestTag, 'commit.id', ''),
    );
    if (!isBranchesInTargetBranch(latestBranches, targetBranch))
      throw new Error(
        `Latest tag doesn't contain target branch. Target branch ${targetBranch}`,
      );

    while (!secondLatestTag) {
      for (const tag of tags) {
        if (isTagsMatchTargetTagRegex([tag], tagRegex)) {
          const branches = await Commit.findBranchRefsByProjectIdAndSha(
            projectId,
            _.get(latestTag, 'commit.id', ''),
          );
          for (const branch of branches) {
            if (isBranchesInTargetBranch(latestBranches, branch.name)) {
              Logger.info(
                `Found the second latest tag on page ${
                  page + 1
                }. The second latest tag is ${tag.name}`,
              );
              secondLatestTag = tag;
              break;
            }
          }
        }
        if (secondLatestTag) break;
      }

      if (!secondLatestTag) {
        if (!_.isFunction(_.get(_link, 'next'))) break;
        const res = await _link.next();
        tags = res.tags;
        _link = res._link;
        page++;
      }
    }
    return _.uniq([latestTag, secondLatestTag]);
  }
};

const getLatestTagByProjectId = async (projectId) => {
  const { tags } = await Gitlab.searchTagsByProjectId(projectId);
  if (!_.isEmpty(tags)) {
    return tags[0];
  }
  return null;
};

const upsertTagDescriptionByProjectIdAndTag = async (
  projectId,
  tag,
  description,
) => {
  if (_.get(tag, 'release.description')) {
    Logger.debug(`Updating the release note`);
    return Gitlab.updateTagReleaseByProjectIdTagNameAndTagId(
      projectId,
      tag.name,
      { description },
    );
  } else {
    Logger.debug(`Creating a new release note`);
    return Gitlab.createTagReleaseByProjectIdTagNameAndTagId(
      projectId,
      tag.name,
      { description },
    );
  }
};

export default {
  isBranchesInTargetBranch,
  isTagsMatchTargetTagRegex,
  getLatestAndSecondLatestTagByProjectId,
  getLatestTagByProjectId,
  upsertTagDescriptionByProjectIdAndTag,
};
