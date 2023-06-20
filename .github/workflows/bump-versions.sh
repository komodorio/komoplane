#!/bin/bash -e

WORKING_DIRECTORY="$PWD"

[ -z "$HELM_CHARTS_SOURCE" ] && HELM_CHARTS_SOURCE="$WORKING_DIRECTORY/charts/komoplane"

[ -z "$APP_VERSION" ] && {
  APP_VERSION=$(cat ${HELM_CHARTS_SOURCE}/Chart.yaml | grep 'appVersion:' | awk -F'"' '{print $2}')
}

sed -i -e "s/appVersion.*/appVersion: \"${APP_VERSION}\" /g" ${HELM_CHARTS_SOURCE}/Chart.yaml
CURRENT_VERSION=$(cat ${HELM_CHARTS_SOURCE}/Chart.yaml | grep 'version:' | awk '{print $2}')
NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{$NF = $NF + 1;} 1' | sed 's/ /./g')
sed -i -e "s/${CURRENT_VERSION}/${NEW_VERSION}/g" ${HELM_CHARTS_SOURCE}/Chart.yaml

echo Resulting YAML:
cat ${HELM_CHARTS_SOURCE}/Chart.yaml