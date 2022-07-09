use id3::{Frame, Tag, TagLike};
use neon::{prelude::*, types::buffer::TypedArray};

fn u8_vec_to_buffer<'a, C: Context<'a>>(cx: &mut C, vec: &Vec<u8>) -> JsResult<'a, JsBuffer> {
    let buffer = JsBuffer::new(cx, vec.len())?;

    for (i, s) in vec.iter().enumerate() {
        let n = s.clone();
        let v = cx.number(n);
        buffer.set(cx, i as u32, v)?;
    }

    Ok(buffer)
}

fn buffer_to_u8_vec<'a, C: Context<'a>>(cx: &mut C, buffer: &Handle<JsBuffer>) -> Vec<u8> {
    let vec: Vec<u8> = buffer.as_slice(cx).to_vec();
    return vec;
}

fn load_tag(mut cx: FunctionContext) -> JsResult<JsObject> {
    let js_path: Handle<JsString> = cx.argument(0).expect("Incorrect argument 0 received");
    let path = js_path.value(&mut cx);

    let metadata: Handle<JsObject> = cx.empty_object();
    let tag;


    match Tag::read_from_path(&path) {
        Ok(t) => {
          tag = t;
        },
        Err(error) => {
          match error.kind {
            id3::ErrorKind::NoTag => tag = Tag::new(),
            _ => panic!("Error reading tag: {}", &error.description)
        }
        },
    };

    tag.frames().for_each(|frame| {
        match frame.content() {
            id3::Content::Text(content) => {
                let js_text = cx.string(content);
                metadata
                    .set(&mut cx, frame.id(), js_text)
                    .expect("Failed writing a tag to JavaScript object");
                return;
            }
            id3::Content::ExtendedText(content) => {
                let js_value = cx.string(&content.value);
                let js_description = cx.string(&content.description);

                let js_extended_text = cx.empty_object();
                js_extended_text
                    .set(&mut cx, "value", js_value)
                    .expect("Failed writing an extended text frame value to Javascript runtime");
                js_extended_text
                    .set(&mut cx, "description", js_description)
                    .expect(
                        "Failed writing an extended text frame description to Javascript runtime",
                    );

                metadata
                    .set(&mut cx, frame.id(), js_extended_text)
                    .expect("Failed writing a frame to JavaScript object");
                return;
            }
            id3::Content::Link(content) => {
                let js_text = cx.string(content);
                metadata
                    .set(&mut cx, frame.id(), js_text)
                    .expect("Failed writing a frame to JavaScript object");
                return;
            }
            // id3::Content::ExtendedLink(content) => todo!(),
            id3::Content::Comment(content) => {
                let js_lang = cx.string(&content.lang);
                let js_description = cx.string(&content.description);
                let js_text = cx.string(&content.text);

                let js_comment = cx.empty_object();
                js_comment
                    .set(&mut cx, "lang", js_lang)
                    .expect("Failed writing a comment frame lang to Javascript runtime");
                js_comment
                    .set(&mut cx, "description", js_description)
                    .expect("Failed writing a comment frame description to Javascript runtime");
                js_comment
                    .set(&mut cx, "text", js_text)
                    .expect("Failed writing a comment frame text to Javascript runtime");

                metadata
                    .set(&mut cx, frame.id(), js_comment)
                    .expect("Failed to write a tag to JavaScript object");
                return;
            }
            // id3::Content::Popularimeter(content) => todo!(),
            // id3::Content::Lyrics(content) => todo!(),
            // id3::Content::SynchronisedLyrics(content) => todo!(),
            id3::Content::Picture(content) => {
                let js_picture = cx.empty_object();
                let js_mime_type = cx.string(&content.mime_type);
                let js_picture_type = cx.number(u8::from(content.picture_type));
                let js_description = cx.string(&content.description);
                let js_data = u8_vec_to_buffer(&mut cx, &content.data)
                    .expect("Failed loading image data into Javascript runtime");

                js_picture
                    .set(&mut cx, "MIMEType", js_mime_type)
                    .expect("Failed writing a picture frame MIME type to Javascript runtime");
                js_picture
                    .set(&mut cx, "pictureType", js_picture_type)
                    .expect("Failed writing picture frame picture type to Javascript runtime");
                js_picture
                    .set(&mut cx, "description", js_description)
                    .expect("Failed writing picture frame description to Javascript runtime");
                js_picture
                    .set(&mut cx, "data", js_data)
                    .expect("Failed writing picture frame picture data to Javascript runtime");

                metadata
                    .set(&mut cx, frame.id(), js_picture)
                    .expect("Failed writing a tag to JavaScript object");
                return;
            }
            // id3::Content::EncapsulatedObject(content) => todo!(),
            // id3::Content::Chapter(content) => todo!(),
            // id3::Content::MpegLocationLookupTable(content) => todo!(),
            // id3::Content::Unknown(content) => todo!(),
            _ => {
                panic!("Unsupporeted frame type {}", frame.to_string());
                // panic!("Unknown frame content {}. The file is probably corrupted.", frame.to_string());
            }
        }
    });

    return Ok(metadata);
}

fn update_tag(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let js_path: Handle<JsString> = cx.argument(0).expect("Incorrect argument 0 received");
    let path = js_path.value(&mut cx);

    let js_tag: Handle<JsObject> = cx.argument(1).expect("Incorrect argument 1 received");
    let mut tag = Tag::read_from_path(&path).expect("Failed reading tag");

    macro_rules! transfer_frame {
        ($id:expr, $type:ty, $content:ident, $callback:tt) => {
            match js_tag.get_opt(&mut cx, $id) as NeonResult<Option<Handle<$type>>> {
                Ok(content_option) => {
                    if let Some($content) = content_option $callback
                }
                Err(_) => {}
            }
        };
    }

    // Text frames
    macro_rules! transfer_t_frame {
        ($id:expr) => {
            transfer_frame!($id, JsString, content, {
                tag.add_frame(Frame::text($id, content.value(&mut cx)));
            })
        };
    }

    // URL link frames
    macro_rules! transfer_w_frame {
        ($id:expr) => {
            transfer_frame!($id, JsString, content, {
                tag.add_frame(Frame::link($id, content.value(&mut cx)));
            })
        };
    }

    // https://id3.org/id3v2.4.0-frames
    transfer_t_frame!("TIT1");
    transfer_t_frame!("TIT2");
    transfer_t_frame!("TIT3");
    transfer_t_frame!("TALB");
    transfer_t_frame!("TOAL");
    transfer_t_frame!("TRCK");
    transfer_t_frame!("TPOS");
    transfer_t_frame!("TSST");
    transfer_t_frame!("TSRC");

    transfer_t_frame!("TPE1");
    transfer_t_frame!("TPE2");
    transfer_t_frame!("TPE3");
    transfer_t_frame!("TPE4");
    transfer_t_frame!("TOPE");
    transfer_t_frame!("TEXT");
    transfer_t_frame!("TOLY");
    transfer_t_frame!("TCOM");
    transfer_t_frame!("TMCL");
    transfer_t_frame!("TIPL");
    transfer_t_frame!("TENC");

    transfer_t_frame!("TBPM");
    transfer_t_frame!("TLEN");
    transfer_t_frame!("TKEY");
    transfer_t_frame!("TLAN");
    transfer_t_frame!("TCON");
    transfer_t_frame!("TFLT");
    transfer_t_frame!("TMED");
    transfer_t_frame!("TMOO");

    transfer_t_frame!("TCOP");
    transfer_t_frame!("TPRO");
    transfer_t_frame!("TPUB");
    transfer_t_frame!("TOWN");
    transfer_t_frame!("TRSN");
    transfer_t_frame!("TRSO");

    transfer_t_frame!("TOFN");
    transfer_t_frame!("TDLY");
    transfer_t_frame!("TDEN");
    transfer_t_frame!("TDOR");
    transfer_t_frame!("TDRC");
    transfer_t_frame!("TDRL");
    transfer_t_frame!("TDTG");
    transfer_t_frame!("TSSE");
    transfer_t_frame!("TSOA");
    transfer_t_frame!("TSOP");
    transfer_t_frame!("TSOT");

    transfer_w_frame!("WCOM");
    transfer_w_frame!("WCOP");
    transfer_w_frame!("WOAF");
    transfer_w_frame!("WOAR");
    transfer_w_frame!("WOAS");
    transfer_w_frame!("WORS");
    transfer_w_frame!("WPAY");
    transfer_w_frame!("WPUB");

    transfer_frame!("APIC", JsObject, content, {
        let js_mime_type: Handle<JsString> = content
            .get(&mut cx, "MIMEType")
            .expect("APIC.MIMEType not provided");
        let js_picture_type: Handle<JsNumber> = content
            .get(&mut cx, "pictureType")
            .expect("APIC.pictureType not provided");
        let js_description: Handle<JsString> = content
            .get(&mut cx, "description")
            .expect("APIC.description not provided");
        let js_data: Handle<JsBuffer> = content
            .get(&mut cx, "data")
            .expect("APIC.data not provided");

        let mime_type = js_mime_type.value(&mut cx);
        // let picture_type = js_picture_type.value(&mut cx);
        let picture_type = id3::frame::PictureType::Undefined(js_picture_type.value(&mut cx) as u8);
        let description = js_description.value(&mut cx);
        let data: Vec<u8> = buffer_to_u8_vec(&mut cx, &js_data);

        let picture = id3::frame::Picture {
            mime_type,
            picture_type,
            description,
            data,
        };
        tag.add_frame(Frame::with_content(
            "APIC",
            id3::Content::Picture(picture.clone()),
        ));
    });

    tag.write_to_path(&path, id3::Version::Id3v24)
        .expect("Failed saving tag to file");

    return Ok(cx.undefined());
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("loadTag", load_tag)?;
    cx.export_function("updateTag", update_tag)?;
    Ok(())
}
