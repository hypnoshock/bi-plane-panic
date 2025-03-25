#!/bin/bash
mkdir -p ~/Projects/jimmy/hypnoshock.github.io/bi-planes
rsync -av dist/ ~/Projects/jimmy/hypnoshock.github.io/bi-planes
cd ~/Projects/jimmy/hypnoshock.github.io/bi-planes
git add -A
git commit -m "update to bi-planes"
git push 