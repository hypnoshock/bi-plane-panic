#!/bin/bash
rsync -av dist/ ~/Projects/jimmy/hypnoshock.github.io/template
cd ~/Projects/jimmy/hypnoshock.github.io/template
git add -A
git commit -m "update to template"
git push 