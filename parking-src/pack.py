#!/usr/bin/env python3
"""Упаковка «Парковки» в .zpk (device.zip + app-side.zip) по образцу рабочих циферблатов."""
import json, sys, time, zipfile, copy, os

HERE = os.path.dirname(os.path.abspath(__file__))
REF = sys.argv[1]          # распакованный рабочий циферблат (dev/app.js, dev/app.json, side/app.json)
OUT = sys.argv[2]
VER, CODE = sys.argv[3], int(sys.argv[4])
APP_ID = 1092830

dev = json.load(open(f'{REF}/dev/app.json', encoding='utf-8'))
side = json.load(open(f'{REF}/side/app.json', encoding='utf-8'))
ts = int(time.time())
for j in (dev, side):
    j['app']['appId'] = APP_ID
    j['app']['version'] = {'code': CODE, 'name': VER}
    j['packageInfo']['timeStamp'] = ts
dev['app']['appName'] = 'Парковка'
dev['app']['description'] = 'Время из машин: водители идут к машинам, садятся и уезжают, на их место заезжают другие'
dev['i18n'] = {'en-US': {'icon': 'Preview.png', 'appName': 'Parking'}, 'ru-RU': {'icon': 'Preview.png', 'appName': 'Парковка'}}
side['app']['appName'] = 'Parking'
side['i18n'] = {'en-US': {'icon': '', 'appName': 'Parking'}}

build = os.path.join(HERE, 'build'); os.makedirs(build, exist_ok=True)
with zipfile.ZipFile(f'{build}/device.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    z.write(f'{REF}/dev/app.js', 'app.js')
    z.writestr('app.json', json.dumps(dev, ensure_ascii=False, indent=2))
    z.write(os.path.join(HERE, 'src/index.js'), 'watchface/index.js')
    for f in sorted(os.listdir(os.path.join(HERE, 'assets'))):
        z.write(os.path.join(HERE, 'assets', f), 'assets/' + f)
with zipfile.ZipFile(f'{build}/app-side.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('app.json', json.dumps(side, ensure_ascii=False, indent=2))
with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
    z.write(f'{build}/device.zip', 'device.zip')
    z.write(f'{build}/app-side.zip', 'app-side.zip')
print(OUT, os.path.getsize(OUT))
