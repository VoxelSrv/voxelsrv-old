const options = new URLSearchParams(window.location.search)

var server = options.get('ip')

var username = options.get('username')

console.log('Username: ' + username, 'Server: ' + server)

global.game = {
	name: 'VoxelSRV',
	version: '0.1.1'
}
const io = require('socket.io-client')
const cruncher = require('voxel-crunch')
const ndarray = require('ndarray')
var vec3 = require('gl-vec3')

const socket = new io('ws://' + server)

import Engine from 'noa-engine'
import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import 'babylonjs-loaders'
import { registerBlocks, registerItems } from './registry'
import { setupGuis } from './gui/setup'
import { updateInventory } from './gui/inventory'
import { setChunk } from './world'
import { setupPlayer, setupControls } from './player'
import { addToChat } from './gui/chat'
import { playSound } from './sound'
import { Socket } from 'socket.io-client'

const engineParams = {
	debug: true,
	showFPS: true,
	inverseY: false,
	inverseX: false,
	sensitivityX: 15, // Make it changeable?
	sensitivityY: 15, // ^
	chunkSize: 24, // Don't touch this
	chunkAddDistance: 5.5, // Make it changeable?
	chunkRemoveDistance: 6.0, // ^
	blockTestDistance: 8, // Per Gamemode?
	tickRate: 50, // Maybe make it lower
	texturePath: 'textures/',
	playerStart: [0, 100, 0], // Make y changeable based on terrain/last player possition
	playerHeight: 1.85,
	playerWidth: 0.5,
	playerAutoStep: false, // true for mobile?
	clearColor: [0.8, 0.9, 1],
	ambientColor: [1, 1, 1],
	lightDiffuse: [1, 1, 1],
	lightSpecular: [1, 1, 1],
	groundLightColor: [0.5, 0.5, 0.5],
	useAO: true,
	AOmultipliers: [0.93, 0.8, 0.5],
	reverseAOmultiplier: 1.0,
	preserveDrawingBuffer: true,
	gravity: [0, -14, 0],
	bindings: {
		"forward": ["W"],
		"left": ["A"],
		"backward": ["S"],
		"right": ["D"],
		"fire": "<mouse 1>",
		"mid-fire": ["<mouse 2>"],
		"alt-fire": ["<mouse 3>"],
		"jump": "<space>",
		"inventory": ["E", "I"],
		"pause": ["P"],
		"muteMusic": ["O"],
		"thirdprsn": ["M"],
		"cmd" :["<enter>"],
		"chat" :["T"]
	}
}


socket.on('login-request', function(dataLogin) {
	socket.emit('login', {
		username: username,
		protocol: 1
	})

	socket.on('kick', function(data) {
		console.log('You has been kicked from server \nReason: ' + data)
		return
	})

	var entityIgnore = 0
	var entityList = {}

	socket.on('entity-ignore', function(data) {
		console.log('Ignoring player-entity: ' + data)
		entityIgnore = data
		if (entityList[data] != undefined) noa.ents.deleteEntity(entityList[data]); delete entityList[data]
	})

	socket.on('login-success', function() {
		document.body.innerHTML = ""
		var noa = new Engine(engineParams)
		var moveState = noa.inputs.state
		var lastPos = {}
		var lastRot = 0

		registerBlocks(noa, dataLogin.blocks, dataLogin.blockIDs)
		registerItems(noa, dataLogin.items)

		setupControls(noa, socket)
		setupPlayer(noa)

		setupGuis(noa, server, socket)
		
		socket.on('chunkdata', function(data) {
			var chunkdata = cruncher.decode(Object.values(data.chunk), new Uint16Array(24 * 120 * 24))
			var array = new ndarray(chunkdata, [24, 120, 24])
			setChunk(data.id, array, noa)
		})

		socket.on('block-update', function(data) {
			noa.setBlock(data.id, data.pos)
		})

		socket.on('inventory-update', function(data) {
			noa.ents.getState(noa.playerEntity, 'inventory').main = data.main
			noa.ents.getState(noa.playerEntity, 'inventory').tempslot = data.tempslot
			updateInventory()
		})

		socket.on('chat', function(data) { 
			addToChat(data)
			console.log('Chat: ' + data)
		})

		socket.on('entity-spawn', async function(data) {
			if (entityIgnore != data.id) {
				entityList[data.id] = noa.ents.add(Object.values(data.data.position), 1, 2, null, null, false, true)
				
				var mesh = BABYLON.MeshBuilder.CreateBox("player", {height: 1.85, width: 0.5, depth: 0.5}, scene)

				noa.entities.addComponent(entityList[data.id], noa.entities.names.mesh, {
					mesh: mesh,
					offset: [0, 0.9, 0]
				})
			}
		})

		/*socket.on('entity-update', function(data) {
			if (data.index == '')
			noa.ents.getState()
		})*/

		socket.on('entity-despawn', function(data) {
			if (entityList[data] != undefined) noa.ents.deleteEntity(entityList[data]); delete entityList[data]

		})

		socket.on('entity-move', function(data) {
			if (entityList[data.id] != undefined) {
				var pos = Object.values(data.data.pos)
				noa.ents.getState(entityList[data.id], 'position').newPosition = data.data.pos
				noa.ents.getState(entityList[data.id], 'position').rotation = data.data.rot
			}
		})

		socket.on('sound-play', function(data) { playSound(data.sound, data.volume) } )


		socket.emit('move', {pos: noa.ents.getState(noa.playerEntity, 'position').position, rot: noa.ents.getState(noa.playerEntity, 'position').position})
		var timerPos = 0

		
		noa.on('tick', function() {
			timerPos = timerPos + 1
			if (timerPos == 2) {
				timerPos = 0
				var pos = noa.ents.getState(noa.playerEntity, 'position').position
				var rot = noa.camera.heading
				if (JSON.stringify(lastPos) != JSON.stringify(pos) || JSON.stringify(lastRot) != JSON.stringify(rot) ) {
					lastPos = [...pos]
					lastRot = JSON.parse( JSON.stringify(rot) )

					socket.emit('move', {pos: pos, rot: rot})
				}
			}
		})
		noa.on('beforeRender', async function() {
			Object.values(entityList).forEach(async function (id) {
				var pos = noa.ents.getState(id, 'position').position
				var newPos = noa.ents.getState(id, 'position').newPosition
				if (newPos != undefined && pos != undefined) {
					var move = vec3.create()	
					vec3.lerp(move, pos, newPos, 0.2)			
					//noa.ents.setPosition(id, [ pos[0] + move[0]/2, pos[1] + move[1]/2, pos[2] + move[2]/2])
					var rot = JSON.parse( JSON.stringify(noa.ents.getState(id, noa.entities.names.mesh).mesh.rotation.y) )
					var newRot = noa.ents.getState(id, 'position').rotation
					noa.ents.setPosition(id, move)
					noa.ents.getState(id, noa.entities.names.mesh).mesh.rotation.y = (2*rot + newRot)/4
				}


			})
		})

	})
})

socket.once('disconnect', function() {
	document.body.innerHTML = '<div class="">' 
} )