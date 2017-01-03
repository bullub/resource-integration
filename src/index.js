/**
 * 作者: bullub
 * 日期: 2016/12/27 09:30
 * 用途:
 */
"use strict";
const path = require("path");

const ResourceResolver = require("./lib/ResourceResolver");
const ResourceBuilder = require("./lib/ResourceBuilder");
const BuildHelper = require("./lib/BuildHelper");

module.exports = {
    //解析文件，抽取语法信息
    resolveSyntax: ResourceResolver.resolve,
    //根据语法信息进行构建
    buildBySyntaxInfo: ResourceBuilder.build,
    //直接构建文件
    build,
    //构建辅助工具
    BuildHelper
};

/**
 * 直接构建文件
 * @param options
 */
function build(options) {

    options = Object.assign({}, {srcRoot: "./src"}, options);

    let file = options.file,
        addedFiles = [],
        srcRoot = path.resolve(options.srcRoot);

    //语法信息
    let syntaxInfo = ResourceResolver.resolve(file.contents.toString("utf-8"), file.path);
    // console.log(syntaxInfo);

    let {combinedRecords, contentLines} = syntaxInfo;

    combinedRecords.forEach(combinedRecord => {
        //拿到包含的所有文件的列表(这个包含的都是文件的绝对路径)
        let includeFiles = BuildHelper.getRealFilePath(file, combinedRecord.files, srcRoot);

        //将源码根路径添加到合并记录对象上
        combinedRecord.srcRoot = srcRoot;

        //执行构建，拿到合并后的内容
        let combinedResult = ResourceBuilder.build(file, combinedRecord, includeFiles);

        if(combinedResult.errors.length) {
            //构建报错了
            console.error("errors");
        }

        //生成目标文件
        let buildFile = BuildHelper.getDistFile(file, srcRoot, combinedRecord.distFile, combinedResult.contents);

        //将目标文件添加到新增的文件列表中
        addedFiles.push(buildFile);

        contentLines[combinedRecord.startLine] = contentLines[combinedRecord.startLine] + "\n" + BuildHelper.getTag(file, buildFile, combinedRecord.type);

        contentLines[combinedRecord.endLine] = '';
    });

    //将文件内容替换成解析后的内容
    file.contents = Buffer.from(contentLines.join("\n"), "utf8");

    return {
        file,
        addedFiles
    };
}