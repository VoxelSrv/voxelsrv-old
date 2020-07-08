import { isMobile } from 'mobile-device-detect'
import { createMultiplayerWindow } from './gui/menu/multiplayer'
import { createSettingsWindow } from './gui/menu/settings'

//  Global informations

global.game = {
	name: 'VoxelSRV',
	version: '0.1.8-dev',
	allowCustom: true
}

// Default settings

if (localStorage.getItem('nickname') == undefined) localStorage.setItem('nickname', 'Player' + Math.round(Math.random() * 1000 ) )
if (localStorage.getItem('autostep') == undefined) localStorage.setItem('autostep', isMobile)


// Main menu

var menuScreen = document.createElement('div') // Background
menuScreen.id = 'menu_screen'
menuScreen.style['background-image'] = 'url(./textures/menu.jpg)'

var menuContainer = document.createElement('div') // Container
menuContainer.id = 'menu_container'

menuScreen.appendChild(menuContainer)


var menuLogo = document.createElement('img') // Logo
menuLogo.id = 'menu_logo'
menuLogo.src = './textures/gui/logo.png'

menuContainer.appendChild(menuLogo)


var multiplayerWindow = createMultiplayerWindow() // Creates and sets multiplayerWindow
multiplayerWindow.style.display = 'none'
menuScreen.appendChild(multiplayerWindow)

var settingsWindow = createSettingsWindow() // Creates and sets settingsWindow
settingsWindow.style.display = 'none'
menuScreen.appendChild(settingsWindow)

// Menu options

var menuOptions = document.createElement('ul')
menuOptions.id = 'menu_options'
menuOptions.classList.add('menu_list')

var multiplayerOption = document.createElement('li')
multiplayerOption.innerHTML = 'Multiplayer'
multiplayerOption.onclick = function() { multiplayerWindow.style.display = 'initial'}
menuOptions.appendChild(multiplayerOption)

var settingsOption = document.createElement('li')
settingsOption.innerHTML = 'Settings'
settingsOption.onclick = function() { settingsWindow.style.display = 'initial'}
menuOptions.appendChild(settingsOption)

var githubOption = document.createElement('li')
githubOption.innerHTML = 'Github'
githubOption.onclick = function() { window.open('https://github.com/Patbox/voxelsrv', '_blank') }
menuOptions.appendChild(githubOption)

var discordOption = document.createElement('li')
discordOption.innerHTML = 'Official discord'
discordOption.onclick = function() { window.open('https://discord.com/invite/K9PdsDh', '_blank') }
menuOptions.appendChild(discordOption)

menuContainer.appendChild(menuOptions)

// Version

var menuVersion = document.createElement('div')
menuVersion.id = 'menu_version'
menuVersion.innerHTML = game.name + ' ' + game.version

menuScreen.appendChild(menuVersion)


// Mobile css 

if (isMobile) {
	var link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'mobile.css'
	document.head.appendChild(link)
	document.documentElement.addEventListener('click', function() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen()
		}
	})
}


window.onload = function() { document.body.appendChild(menuScreen) }
