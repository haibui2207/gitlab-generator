import _  from "lodash"
import Gitlab  from "../adapters/gitlab"


const searchIssuesByProjectIdStateStartDateAndEndDate = async (projectId, state, startDate, endDate) => {
  let { issues, _link } = await Gitlab.searchIssuesByProjectId(projectId, {
    state,
    updated_before: endDate,
    updated_after: startDate
  });
  while (_.get(_link, "next")) {
    const res = await _link.next();
    issues = [...issues, res.issues];
    _link = res._link;
  }
  return issues;
};

const decorateIssue = (issue, options = {}) => {
  return options.useSlack ? slackDecorator(issue) : gitLabDecorator(issue)
};

const gitLabDecorator = (issue) => {
  return `- [#${issue.iid}](${issue.web_url}) ${issue.title} `;
};

const slackDecorator = (issue) => {
  return `- ${issue.title} <${issue.web_url}|#${issue.iid}>`
};

export default {
  searchIssuesByProjectIdStateStartDateAndEndDate,
  decorateIssue,
  gitLabDecorator,
  slackDecorator,
}