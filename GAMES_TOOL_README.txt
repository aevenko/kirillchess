Как добавлять партии без изменения кода
1) Просто загрузи новый .pgn файл в папку data/games/ (через GitHub Upload или git push).
2) Ничего больше не трогай — GitHub Actions сам пересоберёт data/games/index.json.
3) Страница /games.html читает index.json и покажет новую партию.

Если хочешь, чтобы партия корректно попала в список, в PGN должны быть теги:
[White "..."]
[Black "..."]
[Event "..."]
[Date "YYYY.MM.DD"]
[Result "1-0" / "0-1" / "1/2-1/2"]
