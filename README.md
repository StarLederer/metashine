<img src='https://github.com/HermanLederer/metashine/raw/main/buildResources/icon.png' alt='Metashinbe logo' height='64'/>

# Metashine
Open source application that helps you find, write and format audio and video meta tags to your liking. [Install now](https://github.com/HermanLederer/metashine/releases).

![app screenshot](https://i.imgur.com/bQjdMud.png)

## Features
- Clean and modern look
- Automatic suggestions (coming soon)
- User-currated sraping of Spotify and Soundloud for tags

## I need your help
I want the app to support as many audio formats ass possible. Rigth now it can read pretty much anything stanks to [music-metadata](https://github.com/Borewit/music-metadata), but only writes ID3 v2.2 and v2.3 tags in MP3 files, which is powered by [node-id3](https://github.com/Zazama/node-id3).

I am looking for your help to implement writing tags to more formats. If you find a package that can write to WAV, OGG or FLAC or want to make one please let me know or feel free to create a pull request with your own implementation.
