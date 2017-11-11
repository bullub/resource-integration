/**
 * 作者: bullub
 * 日期: 2016/12/30 19:15
 * 用途:
 */
"use strict";
const crypto = require("crypto");

const path = require("path");

const File = require("vinyl");

const RESOURCE_TYPES = {
    JS: 0,
    CSS: 1
};

//资源的标签生成器
const RESOURCE_TAG_GENERATORS = {
    0: function (file, buildFile, md5) {
        return `<script src="${path.relative(path.dirname(file.path), buildFile.path)}?_=${md5}"></script>`;
    },
    1: function (file, buildFile, md5) {
        return `<link rel="stylesheet" href="${path.relative(path.dirname(file.path), buildFile.path)}?_=${md5}"/>`;
    }
};

module.exports = {
    RESOURCE_TYPES,
    /**
     * 获取文件在磁盘上的绝对路径
     * @param files {Array<String>} 相对路径或绝对于cwd下的路径
     * @param currentFile {File} vinly 当前文件
     * @param srcRoot {String} 文件的基础路径
     * @returns {Array<String>} 磁盘路径
     */
    getRealFilePath(currentFile, files, srcRoot){
        let filePath,
            fileRealPath,
            baseDir = path.dirname(currentFile.path);

        for(let i = 0, len = files.length; i < len; i ++) {
            filePath = files[i] && files[i].trim();
            if(!filePath) {
                //路径为空，跳过
                continue;
            }

            //无法解析远程地址
            if(filePath.startsWith("http") || filePath.startsWith("https")) {
                throw new Error("[Error]: [ResourceIntegration] The remote path in your combined segments, but I can't do it.");
            }


            if(filePath[0] === '/') {
                //是绝对路径，使用cwd进行组合
                fileRealPath = path.resolve(srcRoot, filePath);
            } else {
                fileRealPath = path.resolve(baseDir, filePath);
            }
            files[i] = fileRealPath;
        }
        return files;
    },
    /**
     * 根据当前vinly文件获得指令中制定的目标文件位置
     * @param file {File} 文件对象
     * @param srcRoot {String} 源码目录
     * @param distFilePath {String} 目标文件
     * @param fileContents {String} 文件内容
     * @returns {File} vinly文件
     */
    getDistFile(file, srcRoot, distFilePath, fileContents) {
        let fileRealPath = path.resolve(srcRoot, distFilePath);
        return new File({
            cwd: file.cwd,
            path: fileRealPath,
            contents: Buffer.from(fileContents, "utf8"),
            base: srcRoot
        });
    },
    /**
     * 生成引用标签
     * @param file {File} 源文件
     * @param buildFile {File} 目标文件
     * @param type {Number} Tag类型
     * @param contents {string} 文件内容
     */
    getTag(file, buildFile, type, contents) {

        let md5 = crypto.createHash("md5");
        md5.update(contents);

        let md5Hex = md5.digest('hex');

        return RESOURCE_TAG_GENERATORS[type](file, buildFile, md5Hex.substring(16, 24));
    }
};