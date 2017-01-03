/**
 * 作者: bullub
 * 日期: 2016/12/30 13:50
 * 用途:
 */
"use strict";
const BuildHelper = require("./BuildHelper");

module.exports = {
    resolve
};

//JS资源合并正则
const JS_COMBINED_REG = /<!--combined:js\s*\(\s*([^\s]+)\s*\)\s*-->/i;
//CSS资源合并正则
const CSS_COMBINED_REG = /<!--combined:css\s*\(\s*([^\s]+)\s*\)\s*-->/i;
//资源合并结束标记
const COMBINED_END_REG = /<!--combined-->/i;

//注释内容解析相关正则
const COMMENT_REGS = [
    /<!--/g,
    /-->/g
];

//资源类型对应的抽取路径的正则表达式
const RESOURCE_TAG_REGS = [
    //匹配js
    /<script\s+[^>]*src\s*=\s*(['"]?)([^'"]+\.js)\1[^>]*>[^<]*<\/script>/ig,
    //匹配css
    /<link\s+[^>]*href\s*=\s*(['"]?)([^'"]+\.css)\1[^>]*>/ig
];

//资源类型
const RESOURCE_TYPES = BuildHelper.RESOURCE_TYPES;

function resolve(contents, filePath) {

    if(!contents || typeof contents !== 'string') {
        return null;
    }

    let isInComment = false;

    let contentLines = contents.split(/\r?\n/g);
    let syntaxStack = [];
    let combinedRecords = [];

    let matches = null;

    let combinedRecord = null;

    for(let i = 0, len = contentLines.length; i < len; i ++) {
        if(!isInComment && (matches = contentLines[i].match(JS_COMBINED_REG))) {
            //JS合并开始标记
            syntaxStack.push({
                startLine: i,
                files: [],
                type: RESOURCE_TYPES.JS,
                distFile: matches[1]
            });
            continue ;
        }

        if(!isInComment && (matches = contentLines[i].match(CSS_COMBINED_REG))) {
            //CSS合并开始标记
            syntaxStack.push({
                startLine: i,
                files: [],
                type: RESOURCE_TYPES.CSS,
                distFile: matches[1]
            });
            continue ;
        }



        if(!isInComment && COMBINED_END_REG.test(contentLines[i])) {
            //当前要合并的资源结束标记
            combinedRecord = syntaxStack.pop();

            if(!combinedRecord) {
                //结束标签没有匹配到开始标记报错
                throw new Error(`[Error]: [Resource Integration] Combined syntax error. No start tag find in file.\n${filePath}:${i+1}`);
            }

            combinedRecord.endLine = i;
            combinedRecords.push(combinedRecord);
            continue ;
        }

        if(i === 5) {
            debugger;
        }

        if(resolveComments(contentLines[i], isInComment)) {
            isInComment = true;
        } else {
            isInComment = false;
        }

        //解析需要合并的tag标签
        for(let j = 0, jLen = RESOURCE_TAG_REGS.length; j < jLen && !isInComment;j ++) {
            if(resolveSingleResource(contentLines[i], syntaxStack, j)) {
                //单行匹配成功了，则将当前行中被加入合并的节点内容清空，其余部分保留不变
                contentLines[i] = contentLines[i].replace(RESOURCE_TAG_REGS[j], '');
                break;
            }
        }
    }

    if(syntaxStack.length) {
        //有未闭合的标签
        let notClosedTags = '';

        syntaxStack.forEach(item => {
            notClosedTags += `
${filePath}:${item.startLine + 1}`;

        });

        throw new Error(`[Error]: [Resource Integration] Combined syntax error. No end tag find in file.${notClosedTags}`);
    }

    return {
        contentLines,
        combinedRecords
    };

}

/**
 * 解析单个资源，基于每一行去解析
 * @param line
 * @param syntaxStack
 * @param resourceType
 * @returns {boolean}
 */
function resolveSingleResource(line, syntaxStack, resourceType) {
    let matches,
        combinedRecord,
        combinedPosition = syntaxStack.length - 1,
        matched = false;

    while((combinedRecord = syntaxStack[combinedPosition--])) {
        if(combinedRecord.type === resourceType) {
            break ;
        }
    }

    if(!combinedRecord) {
        //不存在该资源的合并指令
        return false;
    }

    //合并中的单个标签
    while((matches = RESOURCE_TAG_REGS[resourceType].exec(line))) {
        //将参与合并的文件加入到文件列表中
        combinedRecord.files.push(matches[2]);
        matched = true;
    }

    RESOURCE_TAG_REGS[resourceType].lastIndex = 0;

    return matched;
}

function resolveComments(line, isInComment) {
    let commentCheckIndex = 0,
        matched = null;
    if(isInComment) {
        commentCheckIndex = 1;
    }

    //顺序并交替查找当前行中的注释标签，最后检查commentCheckIndex的奇偶性
    //如果是奇数: 表示当前最后没检查到注释的结束
    //如果是偶数: 表示当前最后没检查到注释的开始
    while ((matched = COMMENT_REGS[commentCheckIndex].exec(line))) {
        let lastIndex = COMMENT_REGS[commentCheckIndex].lastIndex;
        commentCheckIndex = (commentCheckIndex + 1) % 2;
        //设置下一个正则的起点为上一次匹配到的位置
        COMMENT_REGS[commentCheckIndex].lastIndex = lastIndex;
    }

    //重置正则的起点
    COMMENT_REGS[0].lastIndex = 0;
    COMMENT_REGS[1].lastIndex = 0;

    //奇数表示没有结束，没结束注释返回1，故只需将原值类型转换为boolean即可
    return commentCheckIndex === 1;
}