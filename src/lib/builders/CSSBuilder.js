/**
 * 作者: bullub
 * 日期: 2016/12/30 19:03
 * 用途:
 */
"use strict";
const fs = require("fs");
const path = require("path");
const BuildHelper = require("../BuildHelper");
const CSS_URL_REG = /url\((['"\s])?([^'"]+)\1\)/img;


module.exports = {
    /**
     * 构建css合并信息，根据当前文件的路径，和当前编译的cwd生成相关构建文件内容及构建后的id和md5
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
            //css构建，需要重写样式中引用的资源路径
            contents += rewriteResourcesPath(fs.readFileSync(realPath).toString(), realPath, path.join(combinedRecord.srcRoot, combinedRecord.distFile)) + ";";
        });

        return {
            contents,
            errors
        };
    }
};

/**
 * 重写样式文件中引用的资源的路径
 * @param content {String} 文件内容
 * @param currentCssPath {String} 当前样式文件路径
 * @param distCssPath {String} 合并后的目标样式文件路径
 */
function rewriteResourcesPath(content, currentCssPath, distCssPath) {

    let currentCssDir = path.dirname(currentCssPath),
        distCssDir = path.dirname(distCssPath);

    //当两个样式文件的目录相同时，不需要进行任何路径重写
    if(currentCssDir === distCssDir) {
        return content;
    }

    //否则，进行路径重写
    return content.replace(CSS_URL_REG, function(matched, $1, url, index, contents){

        //绝对路径和远程路径不重写
        if(url[0] === '/' || url.startsWith("http://") || url.startsWith("https://") || url.startsWith("://")) {
            return matched;
        }

        let resourceRealPath = path.resolve(currentCssDir, url);
        return "url(" + $1 + path.relative(distCssDir, resourceRealPath) + $1 + ")";
    });
}