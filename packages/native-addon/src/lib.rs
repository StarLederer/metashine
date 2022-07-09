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

fn arraybuffer_to_u8_vec<'a, C: Context<'a>>(cx: &mut C, buffer: &Handle<JsArrayBuffer>) -> Vec<u8> {
    let vec: Vec<u8> = buffer.as_slice(cx).to_vec();
    return vec;
}

fn load_tag(mut cx: FunctionContext) -> JsResult<JsArray> {
    let js_path: Handle<JsString> = cx.argument(0).expect("Incorrect argument 0 received");
    let path = js_path.value(&mut cx);

    let js_metadata: Handle<JsArray> = cx.empty_array();

    // Read tag or create a new one
    let tag;
    match Tag::read_from_path(&path) {
        Ok(t) => {
            tag = t;
        }
        Err(error) => match error.kind {
            id3::ErrorKind::NoTag => tag = Tag::new(),
            _ => panic!("Error reading tag: {}", &error.description),
        },
    };

    macro_rules! transfer_frame_as_tuple {
        ($i:expr, $tag_type:expr, $tag_id:expr, $tag_content:expr) => {
            let js_type = cx.string($tag_type);
            let js_key = cx.string($tag_id);

            let js_tuple = cx.empty_array();
            js_tuple.set(&mut cx, 0, js_type).unwrap();
            js_tuple.set(&mut cx, 1, js_key).unwrap();
            js_tuple.set(&mut cx, 2, $tag_content).unwrap();

            js_metadata
                .set(&mut cx, $i, js_tuple)
                .expect("Failed writing a tag to JavaScript object");

            $i += 1;
        };
    }

    // Write frames to a JS object
    let mut i: u32 = 0;
    tag.frames().for_each(|frame| {
        match frame.content() {
            // Texts
            id3::Content::Text(content) => {
                let js_string = cx.string(content);
                transfer_frame_as_tuple!(i, "text", frame.id(), js_string);
                return;
            }

            // Extended texts
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

                transfer_frame_as_tuple!(i, "extended text", frame.id(), js_extended_text);
                return;
            }

            // Links
            id3::Content::Link(content) => {
                let js_text = cx.string(content);
                transfer_frame_as_tuple!(i, "link", frame.id(), js_text);
                return;
            }

            // Extended links
            // id3::Content::ExtendedLink(content) => todo!(),

            // Comments
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

                transfer_frame_as_tuple!(i, "comment", frame.id(), js_comment);
                return;
            }

            // Popularimeters
            // id3::Content::Popularimeter(content) => todo!(),

            // Lyrics
            // id3::Content::Lyrics(content) => todo!(),

            // SynchronisedLyrics
            // id3::Content::SynchronisedLyrics(content) => todo!(),

            // Pictures
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

                transfer_frame_as_tuple!(i, "picture", frame.id(), js_picture);
                return;
            }

            // Encapsulated objects
            id3::Content::EncapsulatedObject(content) => {
                let js_enc_object = cx.empty_object();
                let js_mime_type = cx.string(&content.mime_type);
                let js_filename = cx.string(&content.filename);
                let js_description = cx.string(&content.description);
                let js_data = u8_vec_to_buffer(&mut cx, &content.data)
                    .expect("Failed loading image data into Javascript runtime");

                js_enc_object
                    .set(&mut cx, "MIMEType", js_mime_type)
                    .unwrap();
                js_enc_object.set(&mut cx, "filename", js_filename).unwrap();
                js_enc_object
                    .set(&mut cx, "description", js_description)
                    .unwrap();
                js_enc_object.set(&mut cx, "data", js_data).unwrap();

                transfer_frame_as_tuple!(i, "encapsulated object", frame.id(), js_enc_object);
            }

            // Chapters
            // id3::Content::Chapter(content) => todo!(),

            // MpegLocationLookupTables
            // id3::Content::MpegLocationLookupTable(content) => todo!(),

            // Unknown frames
            id3::Content::Unknown(content) => {
                let js_data = u8_vec_to_buffer(&mut cx, &content.data).unwrap();
                transfer_frame_as_tuple!(i, "unknown", frame.id(), js_data);
            }

            // Frames that are not implemented yet
            _ => {
                panic!("Unsupporeted frame type {}", frame.to_string());
            }
        }
    });

    return Ok(js_metadata);
}

fn write_tag(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let js_path: Handle<JsString> = cx.argument(0).expect("Incorrect argument 0 received");
    let path = js_path.value(&mut cx);

    let js_tag: Handle<JsArray> = cx.argument(1).expect("Incorrect argument 1 received");
    let mut tag = Tag::new();

    let frame_tuples: Vec<Handle<JsValue>> = js_tag.to_vec(&mut cx).expect("");

    frame_tuples.iter().for_each(|tuple| {
        match tuple.downcast_or_throw::<JsArray, FunctionContext>(&mut cx) {
            Ok(js_tuple) => {
                let js_frame_type: Handle<JsString> = js_tuple.get(&mut cx, 0).unwrap();
                let frame_type = js_frame_type.value(&mut cx);
                let js_frame_name: Handle<JsString> = js_tuple.get(&mut cx, 1).unwrap();
                let frame_name = js_frame_name.value(&mut cx);

                // Texts
                if frame_type == "text" {
                    let js_frame_content: Handle<JsString> = js_tuple.get(&mut cx, 2).unwrap();
                    let frame_content = js_frame_content.value(&mut cx);
                    tag.add_frame(Frame::text(frame_name, frame_content));
                }
                // Pictures
                else if frame_type == "picture" {
                    let js_frame_content: Handle<JsObject> = js_tuple.get(&mut cx, 2).unwrap();
                    let js_mime_type: Handle<JsString> = js_frame_content
                        .get(&mut cx, "MIMEType")
                        .expect("APIC.MIMEType not provided");
                    let js_picture_type: Handle<JsNumber> = js_frame_content
                        .get(&mut cx, "pictureType")
                        .expect("APIC.pictureType not provided");
                    let js_description: Handle<JsString> = js_frame_content
                        .get(&mut cx, "description")
                        .expect("APIC.description not provided");
                    let js_data: Handle<JsArrayBuffer> = js_frame_content
                        .get(&mut cx, "data")
                        .expect("APIC.data not provided");

                    let mime_type = js_mime_type.value(&mut cx);
                    // let picture_type = js_picture_type.value(&mut cx);
                    let picture_type =
                        id3::frame::PictureType::Undefined(js_picture_type.value(&mut cx) as u8);
                    let description = js_description.value(&mut cx);
                    let data: Vec<u8> = arraybuffer_to_u8_vec(&mut cx, &js_data);

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
                }
            }
            Err(_) => {}
        }
    });

    tag.write_to_path(&path, id3::Version::Id3v24)
        .expect("Failed saving tag to file");

    return Ok(cx.undefined());
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("loadTag", load_tag)?;
    cx.export_function("writeTag", write_tag)?;
    Ok(())
}
