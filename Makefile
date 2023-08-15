install:	#Установка пакетов
	npm ci

link:		#Линк пакетов
	sudo npm link

publish:	#Проверка публикации
	npm publish --dry-run

lint:		#Проверка линтером
	npx eslint .