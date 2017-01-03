/**
 * 作者: bullub
 * 日期: 2016/12/30 18:36
 * 用途:
 */
"use strict";
const BuildHelper = require("./BuildHelper");
const BUILDERS = [
    require("./builders/JSBuilder"),
    require("./builders/CSSBuilder")
];


module.exports = {
    build  
};

/**
 * 构建当前单个类型的引入，生成当前语法节点构建后的内容
 * @param currentFile {File} 当前解析的主文件
 * @param combinedRecord {Object} 合并指令记录
 * @param includeFiles {Array<String>} 参与合并的文件
 * @returns {String} 合并后的内容
 */
function build(currentFile, combinedRecord, includeFiles) {

    return BUILDERS[combinedRecord.type].build(currentFile, combinedRecord, includeFiles);
}
