const postBlocks = ({
  app,
  respond,
  token,
  blocks,
  userId,
  responseType = 'ephemeral',
  replaceOriginal = true,
}) => {
  if (respond) {
    respond({
      token,
      replace_original: replaceOriginal,
      response_type: responseType,
      blocks,
    })
  } else {
    app.client.views.publish({
      token,
      user_id: userId,
      view: {
        type: 'home',
        blocks,
      },
    })
  }
}

// const postText =
export default postBlocks
