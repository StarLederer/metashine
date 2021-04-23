# Metashine
Open source application that helps you find, write and format mp3 tags to your liking.

![app screenshot](https://i.imgur.com/bQjdMud.png)

## What makes this app special
- Clean and modern look
- Automatic suggestions (coming soon)
- User-currated sraping of Amazon, Spotify and Soundloud for tags (coming in the future)

## I need your help
I want the app to support as many audio formats ass possible. Rigth now it can read pretty much anything stanks to [music-metadata](https://github.com/Borewit/music-metadata), but only writes ID3 v2.2 and v2.3 tags in MP3 files, which is powered by [node-id3](https://github.com/Zazama/node-id3).

I am looking for your help to implement writing tags to more formats. If you find a package that can write to WAV, OGG or FLAC or want to make one please let me know or feel free to create a pull request with your own implementation.
