import Gitlab from '../adapters/gitlab';

const findBranchRefsByProjectIdAndSha = async (projectId, sha) => {
  return Gitlab.findCommitRefsByProjectIdAndSha(projectId, sha, {
    type: 'branch',
  });
};

export default {
  findBranchRefsByProjectIdAndSha,
};
