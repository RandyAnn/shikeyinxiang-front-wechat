/**
 * 文件缓存工具函数
 */

/**
 * 下载并缓存头像图片
 * @param {string} url - 头像的远程URL
 * @returns {Promise<string>} - 返回本地缓存的文件路径
 */
export const downloadAndCacheAvatar = (url) => {
  return new Promise((resolve, reject) => {
    // 如果URL为空，直接返回默认头像
    if (!url) {
      resolve('/static/images/default-avatar.png');
      return;
    }

    // 生成缓存文件名
    const fileName = 'avatar_' + new Date().getTime() + '.png';

    // 先下载文件到临时目录
    uni.downloadFile({
      url: url,
      success: (res) => {
        if (res.statusCode === 200) {
          // 下载成功，保存到本地缓存目录
          try {
            const fs = uni.getFileSystemManager();
            fs.saveFile({
              tempFilePath: res.tempFilePath,
              success: (saveRes) => {
                // 保存成功，返回本地路径
                resolve(saveRes.savedFilePath);
              },
              fail: (err) => {
                // 保存失败，返回临时路径（临时路径在小程序退出后会被清除）
                resolve(res.tempFilePath);
              }
            });
          } catch (e) {
            // 如果获取文件系统管理器失败，回退到临时路径
            resolve(res.tempFilePath);
          }
        } else {
          reject(new Error('下载头像失败'));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

/**
 * 检查文件是否存在
 * @param {string} filePath - 文件路径
 * @returns {Promise<boolean>} - 返回文件是否存在
 */
export const checkFileExists = (filePath) => {
  return new Promise((resolve) => {
    // 如果不是本地文件路径，直接返回false
    if (!filePath || filePath.startsWith('http') || filePath.startsWith('/static/')) {
      resolve(false);
      return;
    }

    try {
      const fs = uni.getFileSystemManager();
      fs.access({
        path: filePath,
        success: () => {
          // 文件存在
          resolve(true);
        },
        fail: () => {
          // 文件不存在
          resolve(false);
        }
      });
    } catch (e) {
      resolve(false);
    }
  });
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