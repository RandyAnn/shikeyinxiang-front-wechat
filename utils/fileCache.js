/**
 * 文件缓存工具函数 - 简化版本
 * 注意：已移除复杂的头像缓存逻辑，现在直接使用远程URL
 */

/**
 * 下载并缓存头像图片 - 已弃用，保留以兼容现有代码
 * @deprecated 建议直接使用远程URL，让小程序自动处理缓存
 * @param {string} url - 头像的远程URL
 * @returns {Promise<string>} - 返回原始URL
 */
export const downloadAndCacheAvatar = (url) => {
  // 简化实现：直接返回原始URL，不进行本地缓存
  return Promise.resolve(url || '/static/images/default-avatar.png');
};

/**
 * 检查文件是否存在 - 已弃用，保留以兼容现有代码
 * @deprecated 不再需要检查本地文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<boolean>} - 始终返回false
 */
export const checkFileExists = (filePath) => {
  // 简化实现：始终返回false，表示不使用本地缓存
  return Promise.resolve(false);
};

/**
 * 清除头像缓存
 * @returns {Promise<boolean>} - 返回是否成功清除缓存
 */
export const clearAvatarCache = () => {
  return new Promise((resolve) => {
    try {
      // 获取本地缓存文件列表
      const fs = uni.getFileSystemManager();
      uni.getSavedFileList({
        success: (res) => {
          const fileList = res.fileList;
          // 找到所有以avatar_开头的文件
          const avatarFiles = fileList.filter(file =>
            file.filePath.includes('avatar_')
          );

          // 没有找到头像缓存文件
          if (avatarFiles.length === 0) {
            resolve(true);
            return;
          }

          // 删除所有头像缓存文件
          let successCount = 0;
          avatarFiles.forEach(file => {
            fs.removeSavedFile({
              filePath: file.filePath,
              success: () => {
                successCount++;
                if (successCount === avatarFiles.length) {
                  resolve(true);
                }
              },
              fail: () => {
                if (successCount === avatarFiles.length) {
                  resolve(true);
                }
              }
            });
          });
        },
        fail: () => {
          resolve(false);
        }
      });
    } catch (e) {
      resolve(false);
    }
  });
};