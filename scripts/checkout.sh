#!/usr/bin/env bash
set -e

REPOSITORY="${1}"
TARGET_REF="${2:-master}"

DESTINATION=./src/.${REPOSITORY}

if [[ -e .env ]]; then
  source .env
fi

if [[ ! -d "${DESTINATION}" ]]; then
  if [[ -z "${CLONE_TOKEN}" ]]; then
    git clone \
      git@github.com:SatisGraphtory/${REPOSITORY}.git \
      --quiet \
      --reference-if-able ../${REPOSITORY} \
      -n \
      "${DESTINATION}"
  else
    git clone \
      https://${CLONE_TOKEN}@github.com/SatisGraphtory/${REPOSITORY} \
      --quiet \
      --reference-if-able ../${REPOSITORY} \
      -n \
      "${DESTINATION}"
  fi
fi

cd "${DESTINATION}"
git fetch --quiet --tags --force --prune-tags origin
git reset --hard
git checkout --quiet "${TARGET_REF}"
git pull
