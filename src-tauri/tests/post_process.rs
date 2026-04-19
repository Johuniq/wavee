use vox_ai_lib::post_process::PostProcessor;

fn processor() -> PostProcessor {
    PostProcessor::new()
}

#[test]
fn processes_programming_case_commands() {
    let pp = processor();

    assert_eq!(pp.process("camel case user profile id"), "UserProfileId");
    assert_eq!(pp.process("snake case user profile id"), "User_profile_id");
    assert_eq!(pp.process("pascal case user profile id"), "UserProfileId");
    assert_eq!(pp.process("kebab case user profile id"), "User-profile-id");
    assert_eq!(
        pp.process("constant case user profile id"),
        "USER_PROFILE_ID"
    );

    assert_eq!(
        pp.process("use camel case user profile id"),
        "Use userProfileId"
    );
    assert_eq!(
        pp.process("use snake case user profile id"),
        "Use user_profile_id"
    );
}

#[test]
fn processes_code_constructs() {
    let pp = processor();

    assert_eq!(pp.process("function get user name"), "GetUserName()");
    assert_eq!(
        pp.process("call function get user name"),
        "Call getUserName()"
    );
    assert_eq!(
        pp.process("variable current user id"),
        "Variable currentUserId"
    );
    assert_eq!(
        pp.process("class user profile service"),
        "class UserProfileService"
    );
}

#[test]
fn processes_file_mentions_and_paths_before_sentence_casing() {
    let pp = processor();

    assert_eq!(pp.process("open index dot ts"), "Open @index.ts");
    assert_eq!(pp.process("build dot rs"), "@Build.rs");
    assert_eq!(
        pp.process("fix bug in index dot ts"),
        "Fix bug in @index.ts"
    );
}

#[test]
fn processes_symbols_and_spacing_commands() {
    let pp = processor();

    assert_eq!(
        pp.process("foo underscore bar equals value semicolon"),
        "Foo _ bar = value ;"
    );
    assert_eq!(
        pp.process("insert at sign example dot com"),
        "@ Example . Com"
    );
    assert_eq!(pp.process("hello no space world"), "Hello world");
}

#[test]
fn processes_voice_action_commands() {
    let pp = processor();

    assert_eq!(pp.process("delete that"), "[[DELETE_LAST]]");
    assert_eq!(pp.process("undo that"), "[[UNDO]]");
    assert_eq!(pp.process("redo last"), "[[REDO]]");
    assert_eq!(pp.process("select all text"), "[[SELECT_ALL]]");
    assert_eq!(pp.process("copy that"), "[[COPY]]");
    assert_eq!(pp.process("cut that"), "[[CUT]]");
    assert_eq!(pp.process("paste here"), "[[PASTE]]");
}

#[test]
fn processes_newlines_and_punctuation_commands() {
    let pp = processor();

    assert_eq!(pp.process("hello insert comma world"), "Hello , world");
    assert_eq!(pp.process("hello insert question mark"), "Hello ?");
    assert_eq!(pp.process("first new line second"), "First\nsecond");
    assert_eq!(pp.process("first new paragraph second"), "First\n\nsecond");
}

#[test]
fn preserves_common_technical_abbreviations() {
    let pp = processor();

    assert_eq!(pp.process("call the api url"), "Call the API URL");
    assert_eq!(pp.process("parse json and html"), "Parse JSON and HTML");
}
