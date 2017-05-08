#!/bin/sh

echo "###########################################"
echo "###########################################"

pwd=`pwd`
echo "Path:"
echo "${pwd}"
echo "------"

JS_FILE="${pwd}/shared_resources/js/epubReadingSystem.js"
test -z "${CONTENTS_FOLDER_PATH}" || JS_FILE="${TARGET_BUILD_DIR}/${CONTENTS_FOLDER_PATH}/epubReadingSystem.js"
echo "Javascript output:"
echo "${JS_FILE}"
test -z "${CONTENTS_FOLDER_PATH}" && echo "WARNING: file 'epubReadingSystem.js' will NOT be updated in XCode build folder! (running script from raw command line?)"
echo "------"

FIRST=""

GitDo() {
ROOT_DIR=$1
INTERMEDIATE_DIR=$2
GIT_SUBMODULE=$3
SUB_DIR="${ROOT_DIR}${INTERMEDIATE_DIR}${GIT_SUBMODULE}"
TARGET_PREFIX=$4

cd "${SUB_DIR}"

echo "========================="
echo "Git target prefix:"
echo "${TARGET_PREFIX}"
echo "------"

GIT_DIR="${ROOT_DIR}/.git"
echo "Git directory:"
echo "${GIT_DIR}"
echo "------"

echo "Git submodule directory:"
echo "${SUB_DIR}"
echo "------"

# We use "cd" instead! (more reliable, due to vendor submodules not necessarily setup the way we do it internally for Readium)
GIT_DIR_CWD=""
# GIT_DIR_CWD="--git-dir=${GIT_DIR} --work-tree=${SUB_DIR}"
# echo "Git path spec:"
# echo "${GIT_DIR_CWD}"
# echo "------"

GIT_HEAD_PATH="${GIT_DIR}/HEAD"
test -f "${SUB_DIR}/HEAD" && GIT_HEAD_PATH="${SUB_DIR}/HEAD"
test -f "${GIT_DIR}/modules/${GIT_SUBMODULE}/HEAD" && GIT_HEAD_PATH="${GIT_DIR}/modules/${GIT_SUBMODULE}/HEAD"
echo "Git HEAD path:"
echo "${GIT_HEAD_PATH}";
echo "------"

GIT_HEAD=`cat "${GIT_HEAD_PATH}"`
echo "Git HEAD:"
echo "${GIT_HEAD}";
echo "------"

test "${GIT_HEAD#'ref: '}" != "${GIT_HEAD}" && echo "(attached head)" && GIT_SHA=`git ${GIT_DIR_CWD} rev-parse --verify HEAD`
test "${GIT_HEAD#'ref: '}" == "${GIT_HEAD}" && echo "(detached head)" && GIT_SHA="${GIT_HEAD}"

echo "Git SHA:"
echo "${GIT_SHA}"
echo "------"

GIT_TAG=`git ${GIT_DIR_CWD} describe --tags --long ${GIT_SHA}`
echo "Git TAG:"
echo "${GIT_TAG}"
echo "------"

GIT_STATUS=`git ${GIT_DIR_CWD} status --porcelain`
echo "Git STATUS:"
echo "${GIT_STATUS}"
echo "------"

GIT_CLEAN=false
test -z "${GIT_STATUS}" && GIT_CLEAN=true
echo "Git CLEAN:"
echo "${GIT_CLEAN}"
echo "------"

GIT_BRANCH=`git for-each-ref --format="%(refname:short) %(objectname)" 'refs/heads/' | grep $(git rev-parse HEAD) | cut -d " " -f 1`
echo "Git BRANCH:"
echo "${GIT_BRANCH}"
echo "------"

#GIT_TIMESTAMP=`date '+%s'`
GIT_TIMESTAMP=$(($(date '+%s') * 1000))

echo "FIRST:"
echo "${FIRST}"
echo "------"

test -z "${FIRST}" && echo $"" > "${JS_FILE}"
FIRST="false"

echo "ReadiumSDK.READIUM_${TARGET_PREFIX}_sha = '${GIT_SHA}';" >> "${JS_FILE}"
echo "ReadiumSDK.READIUM_${TARGET_PREFIX}_tag = '${GIT_TAG}';" >> "${JS_FILE}"
echo "ReadiumSDK.READIUM_${TARGET_PREFIX}_clean = ${GIT_CLEAN};" >> "${JS_FILE}"

echo "ReadiumSDK.READIUM_${TARGET_PREFIX}_branch = '${GIT_BRANCH}';" >> "${JS_FILE}"
echo "ReadiumSDK.READIUM_${TARGET_PREFIX}_timestamp = ${GIT_TIMESTAMP};" >> "${JS_FILE}"
}



#GitDo "${pwd}" "" "" "iOS"

#GitDo "${pwd}" "/" "readium-sdk" "SDK"

GitDo "${pwd}" "" "" "SHARED_JS"



READIUM_dateTimeString=`date`
echo "ReadiumSDK.READIUM_dateTimeString = '${READIUM_dateTimeString}';" >> "${JS_FILE}"


cat ${JS_FILE}

cd "${pwd}"

echo "###########################################"
echo "###########################################"
