import apiClient from './config.js';

export const commentService = {
  async getReportComments(reportId) {
    const response = await apiClient.get(`/comments/report/${reportId}`);
    return response.data;
  },

  async getReportCommentCount(reportId) {
    const response = await apiClient.get(`/comments/report/${reportId}/count`);
    return response.data;
  },

  async createComment(reportId, { content, parentId, commentLevel, images = [] }) {
    const formData = new FormData();
    formData.append('content', content);
    if (parentId) {
      formData.append('parentId', parentId);
    }
    if (commentLevel !== undefined && commentLevel !== null && commentLevel !== '') {
      formData.append('commentLevel', commentLevel);
    }
    images.forEach((file) => formData.append('images', file));

    const response = await apiClient.post(`/comments/report/${reportId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async updateComment(id, { content, images = [] }) {
    const formData = new FormData();
    if (content !== undefined) {
      formData.append('content', content);
    }
    images.forEach((file) => formData.append('images', file));

    const response = await apiClient.put(`/comments/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteComment(id) {
    const response = await apiClient.delete(`/comments/${id}`);
    return response.data;
  },
};
