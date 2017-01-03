/**
 * 作者: bullub
 * 日期: 2016/12/30 19:03
 * 用途:
 */
"use strict";
const fs = require("fs");
const path = require("path");
const BuildHelper = require("../BuildHelper");

module.exports = {
    /**
     * 构建js合并信息，根据当前文件的路径，和当前编译的cwd生成相关构建文件内容及构建后的id和md5
     * @param file {File} 当前引用资源的文件
     * @param combinedRecord {Object} 当前合并记录，包含了目标文件位置等信息
     * @param includeFiles {Array<String>} 参与合并的文件
     */
    build(file, combinedRecord, includeFiles) {
        let contents = '',
            errors = [];
        includeFiles.forEach(realPath => {
            let stats = fs.statSync(realPath);
            if(!stats.isFile()) {
                errors.push(`[Error]: [Resource Integration] File can't find error. path is [${realPath}]!`);
                return ;
            }

            contents += fs.readFileSync(realPath).toString();
        });
        return {
            contents,
            errors
        };
    }
};