#!/bin/bash
# Фото журнала «Архитектура» с Wikimedia Commons (лицензии CC/PD проверены 15.10.2026). Запуск из ~/shakhmatka:
#   bash content/articles/media/fetch-commons.sh
cd "$(dirname "$0")"
[ -f "zh-psevdorusskiy-1.jpg" ] || curl -sSL -A "shakhmatka-bot/1.0 (editor)" -o "zh-psevdorusskiy-1.jpg" "https://commons.wikimedia.org/wiki/Special:FilePath/Moscow._Igumnov_House_P8100259_2800.jpg?width=1600"
[ -f "zh-psevdorusskiy-2.jpg" ] || curl -sSL -A "shakhmatka-bot/1.0 (editor)" -o "zh-psevdorusskiy-2.jpg" "https://commons.wikimedia.org/wiki/Special:FilePath/Moscow_-_2025_-_Details_of_the_State_Historical_Museum%27s_facade%2C_viewed_from_Red_Square3.jpg?width=1600"
[ -f "zh-psevdorusskiy-3.jpg" ] || curl -sSL -A "shakhmatka-bot/1.0 (editor)" -o "zh-psevdorusskiy-3.jpg" "https://commons.wikimedia.org/wiki/Special:FilePath/Moscow_-_Part_of_the_GUM_facade.jpg?width=1600"
[ -f "zh-shekhtel-1.jpg" ] || curl -sSL -A "shakhmatka-bot/1.0 (editor)" -o "zh-shekhtel-1.jpg" "https://commons.wikimedia.org/wiki/Special:FilePath/Ryabushinsky_House%2C_Moscow_03.JPG?width=1600"
[ -f "zh-shekhtel-2.jpg" ] || curl -sSL -A "shakhmatka-bot/1.0 (editor)" -o "zh-shekhtel-2.jpg" "https://commons.wikimedia.org/wiki/Special:FilePath/Yaroslavsky_Rail_Terminal_Moscow_2023-09-05_8489.jpg?width=1600"
[ -f "zh-shekhtel-3.jpg" ] || curl -sSL -A "shakhmatka-bot/1.0 (editor)" -o "zh-shekhtel-3.jpg" "https://commons.wikimedia.org/wiki/Special:FilePath/Tryokhprudny_5%2C7%2C9_May_2009_02.JPG?width=1600"
[ -f "zh-hafencity-1.jpg" ] || curl -sSL -A "shakhmatka-bot/1.0 (editor)" -o "zh-hafencity-1.jpg" "https://commons.wikimedia.org/wiki/Special:FilePath/Hamburg%2C_HafenCity%2C_Elbphilharmonie_--_2016_--_3062.jpg?width=1600"
[ -f "zh-hafencity-2.jpg" ] || curl -sSL -A "shakhmatka-bot/1.0 (editor)" -o "zh-hafencity-2.jpg" "https://commons.wikimedia.org/wiki/Special:FilePath/Hamburg%2C_HafenCity%2C_Magellan-Terrassen_--_2016_--_3012.jpg?width=1600"
[ -f "zh-vena-1.jpg" ] || curl -sSL -A "shakhmatka-bot/1.0 (editor)" -o "zh-vena-1.jpg" "https://commons.wikimedia.org/wiki/Special:FilePath/Karl_Marx_Hof.jpg?width=1600"
[ -f "zh-vena-2.jpg" ] || curl -sSL -A "shakhmatka-bot/1.0 (editor)" -o "zh-vena-2.jpg" "https://commons.wikimedia.org/wiki/Special:FilePath/Wien_22_Seestadt_Aspern_01.jpg?width=1600"
[ -f "zh-vena-3.jpg" ] || curl -sSL -A "shakhmatka-bot/1.0 (editor)" -o "zh-vena-3.jpg" "https://commons.wikimedia.org/wiki/Special:FilePath/Wien_10_Sonnwendviertel_g.jpg?width=1600"
[ -f "zh-agr-1.jpg" ] || curl -sSL -A "shakhmatka-bot/1.0 (editor)" -o "zh-agr-1.jpg" "https://commons.wikimedia.org/wiki/Special:FilePath/Moscow%2C_Mosfilmovskaya_74B_construction_site_%2821060693709%29.jpg?width=1600"
[ -f "zh-agr-2.jpg" ] || curl -sSL -A "shakhmatka-bot/1.0 (editor)" -o "zh-agr-2.jpg" "https://commons.wikimedia.org/wiki/Special:FilePath/Moscow_City_%2828955341813%29.jpg?width=1600"
[ -f "zh-fili-1.jpg" ] || curl -sSL -A "shakhmatka-bot/1.0 (editor)" -o "zh-fili-1.jpg" "https://commons.wikimedia.org/wiki/Special:FilePath/Moscow%2C_Fili_railway_station_-_reconstruction_in_2016_%2831212868785%29.jpg?width=1600"
[ -f "zh-fili-2.jpg" ] || curl -sSL -A "shakhmatka-bot/1.0 (editor)" -o "zh-fili-2.jpg" "https://commons.wikimedia.org/wiki/Special:FilePath/Moscow%2C_Fili_railway_station_%2831212868215%29.jpg?width=1600"
