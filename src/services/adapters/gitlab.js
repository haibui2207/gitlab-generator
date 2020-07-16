import Request from 'request-promise-native';
import QueryString from 'querystring';
import LinkHeaderParse from 'parse-link-header';
import { getData } from '../localstorage';

const apiRequest = (url, options) => {
  const { accessToken, gitlabEndPoint } = getData();

  return Request({
    uri: `${gitlabEndPoint}${url}`,
    headers: { 'Private-Token': accessToken },
    json: true,
    ...options,
  });
};

const _decorateLinks = (link, templateFunction, templateArgs, query) => {
  const linkObj = {};
  if (link) {
    link = LinkHeaderParse(link);
    for (const key of Object.keys(link)) {
      linkObj[key] = () =>
        templateFunction.apply(null, [
          ...templateArgs,
          { ...query, page: link[key].page, per_page: link[key].per_page },
        ]);
    }
  }
  return linkObj;
};

const getRepoByProjectId = async (projectId) =>
  apiRequest(`/projects/${projectId}`);

const searchMergeRequestsByProjectId = async (projectId, query) => {
  const queryString = query ? QueryString.stringify(query) : null;
  const res = await apiRequest(
    `/projects/${projectId}/merge_requests${
      queryString ? `?${queryString}` : ''
    }`,
    { resolveWithFullResponse: true },
  );
  return {
    mergeRequests: res.body,
    _link: {
      ..._decorateLinks(
        res.headers.link,
        searchMergeRequestsByProjectId,
        [projectId],
        query,
      ),
    },
  };
};

const searchIssuesByProjectId = async (projectId, query) => {
  const queryString = query ? QueryString.stringify(query) : null;
  const res = await apiRequest(
    `/projects/${projectId}/issues${queryString ? `?${queryString}` : ''}`,
    { resolveWithFullResponse: true },
  );
  return {
    issues: res.body,
    _link: {
      ..._decorateLinks(
        res.headers.link,
        searchIssuesByProjectId,
        [projectId],
        query,
      ),
    },
  };
};

const searchTagsByProjectId = async (projectId, query) => {
  const queryString = query ? QueryString.stringify(query) : null;
  const res = await apiRequest(
    `/projects/${projectId}/repository/tags${
      queryString ? `?${queryString}` : ''
    }`,
    { resolveWithFullResponse: true },
  );
  return {
    tags: res.body,
    _link: {
      ..._decorateLinks(
        res.headers.link,
        searchTagsByProjectId,
        [projectId],
        query,
      ),
    },
  };
};

const getMergeRequestByProjectIdAndMergeRequestId = async (
  projectId,
  mergeRequestId,
) => {
  return apiRequest(`/projects/${projectId}/merge_requests/${mergeRequestId}`);
};

const getIssueByProjectIdAndIssueId = async (projectId, issueId) => {
  return apiRequest(`/projects/${projectId}/issues/${issueId}`);
};

const getTagByProjectIdAndTagId = async (projectId, tagName) => {
  return apiRequest(`/projects/${projectId}/repository/tags/${tagName}`);
};

const getCommitByProjectIdAndSha = async (projectId, sha) => {
  return apiRequest(`/projects/${projectId}/repository/commits/${sha}`);
};

const findCommitRefsByProjectIdAndSha = async (projectId, sha, query) => {
  const queryString = query ? QueryString.stringify(query) : null;
  return apiRequest(
    `/projects/${projectId}/repository/commits/${sha}/refs${
      queryString ? `?${queryString}` : ''
    }`,
  );
};

const createTagReleaseByProjectIdTagNameAndTagId = async (
  projectId,
  tagName,
  body,
) => {
  return apiRequest(
    `/projects/${projectId}/repository/tags/${tagName}/release`,
    { method: 'POST', body },
  );
};

const updateTagReleaseByProjectIdTagNameAndTagId = async (
  projectId,
  tagName,
  body,
) => {
  return apiRequest(
    `/projects/${projectId}/repository/tags/${tagName}/release`,
    { method: 'PUT', body },
  );
};

export default {
  _decorateLinks,
  getRepoByProjectId,
  searchIssuesByProjectId,
  searchMergeRequestsByProjectId,
  searchTagsByProjectId,
  getMergeRequestByProjectIdAndMergeRequestId,
  getIssueByProjectIdAndIssueId,
  getTagByProjectIdAndTagId,
  getCommitByProjectIdAndSha,
  findCommitRefsByProjectIdAndSha,
  createTagReleaseByProjectIdTagNameAndTagId,
  updateTagReleaseByProjectIdTagNameAndTagId,
};
