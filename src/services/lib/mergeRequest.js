import _ from 'lodash';
import Gitlab from '../adapters/gitlab';

const getMergeRequestByProjectIdStateStartDateAndEndDate = async (
  projectId,
  state,
  startDate,
  endDate,
) => {
  let { mergeRequests, _link } = await Gitlab.searchMergeRequestsByProjectId(
    projectId,
    {
      state,
      updated_before: endDate,
      updated_after: startDate,
    },
  );
  while (_.get(_link, 'next')) {
    const res = await _link.next();
    mergeRequests = [...mergeRequests, ...res.mergeRequests];
    _link = res._link;
  }
  return mergeRequests;
};

const decorateMergeRequest = (mergeRequest, options = {}) => {
  return options.useSlack
    ? slackDecorator(mergeRequest)
    : gitLabDecorator(mergeRequest);
};

const slackDecorator = (mergeRequest) => {
  return `- ${mergeRequest.title} <${mergeRequest.web_url}|#${
    mergeRequest.iid
  }> (<${_.get(mergeRequest, 'author.web_url')}|${_.get(
    mergeRequest,
    'author.username',
  )}>)`;
};

const gitLabDecorator = (mergeRequest) => {
  // return `- [#${mergeRequest.iid}](${mergeRequest.web_url}) ([${_.get(mergeRequest, "author.username")}](${_.get(mergeRequest, "author.web_url")})) ${mergeRequest.title}`;
  return `- [#${mergeRequest.iid}](${mergeRequest.web_url}) ${mergeRequest.title}`;
};

export default {
  getMergeRequestByProjectIdStateStartDateAndEndDate,
  decorateMergeRequest,
  slackDecorator,
  gitLabDecorator,
};
