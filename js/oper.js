// 读取数据，第一个参数是指定要读取的key以及设置默认值

/**
 * open_action: 打开这个页面执行的操作
 * open_text：打开这页面需要复原的输入框的内容
 */
get_info(function (info) {
  if (info.status) {
    //已经有绑定信息了，折叠
    $('#blog_info').hide()
  }
  $('#apiUrl').val(info.apiUrl)
  $('#key').val(info.key)
  $('#pic7bu').val(info.pic7bu)
  if (info.open_action === 'upload_image') {
    //打开的时候就是上传图片
    console.log(info.open_content)
    uploadImage(info.open_content)
  } else {
    $('#content').val(info.open_content)
  }
  //从localstorage 里面读取数据
  setTimeout(get_info, 1)
})

//监听输入结束，保存未发送内容到本地
$('#content').blur(function () {
  chrome.storage.sync.set(
    { open_action: 'save_text', open_content: $('#content').val() },
    function () {}
  )
})

//监听拖拽事件，实现拖拽到窗口上传图片
initDrag()

//监听复制粘贴事件，实现粘贴上传图片
document.addEventListener('paste', function (e) {
  let photo = null
  if (e.clipboardData.files[0]) {
    photo = e.clipboardData.files[0]
  } else if (e.clipboardData.items[0] && e.clipboardData.items[0].getAsFile()) {
    photo = e.clipboardData.items[0].getAsFile()
  }

  if (photo != null) {
    uploadImage(photo)
  }
})

function initDrag() {
  var file = null
  var obj = $('#content')[0]
  obj.ondragenter = function (ev) {
    if (ev.target.className === 'textarea') {
      console.log('ondragenter' + ev.target.tagName)
      $.message({
        message: '拖拽到窗口上传该图片',
        autoClose: false
      })
      $('body').css('opacity', 0.3)
    }

    ev.dataTransfer.dropEffect = 'copy'
  }
  obj.ondragover = function (ev) {
    console.log('ondragover')

    ev.preventDefault() //防止默认事件拖入图片 放开的时候打开图片了
    ev.dataTransfer.dropEffect = 'copy'
  }
  obj.ondrop = function (ev) {
    console.log('ondrop')
    $('body').css('opacity', 1)
    ev.preventDefault()
    var files = ev.dataTransfer.files || ev.target.files
    for (var i = 0; i < files.length; i++) {
      if (files[i].type.indexOf('image') >= 0) {
        file = files[i]
        break
      }
    }
    uploadImage(file)
  }
  obj.ondragleave = function (ev) {
    ev.preventDefault()
    if (ev.target.className === 'textarea') {
      console.log('ondragleave' + ev.target.tagName)
      $.message({
        message: '取消上传'
      })
      $('body').css('opacity', 1)
    }
  }
}

function uploadImage(data) {
  //显示上传中的动画……
  $.message({
    message: '上传图片中……',
    autoClose: false
  })
  //根据data判断是图片地址还是base64加密的数据
  get_info(function (info) {
    const formData = new FormData()
    if (info.status) {
      formData.append('image', data)
      $.ajax({
        headers: {
          key: info.pic7bu ? info.pic7bu : ''
        },
        url: 'https://7bu.top/api/upload',
        data: formData,
        type: 'post',
        processData: false,
        contentType: false,

        success: function (result) {
          if (result.code === 200) {
            //获取到图片
            chrome.storage.sync.set(
              { open_action: '', open_content: '' },
              function () {
                $.message({
                  message: '上传成功'
                })
                $('#content').val(
                  $('#content').val() + `![](${result.data.url})`
                )
              }
            )
          } else {
            //发送失败
            //清空open_action（打开时候进行的操作）,同时清空open_content
            chrome.storage.sync.set(
              { open_action: '', open_content: '' },
              function () {
                $.message({
                  message: '上传图片失败'
                })
              }
            )
          }
        }
      }).fail(function () {
        //清空open_action（打开时候进行的操作）,同时清空open_content
        chrome.storage.sync.set(
          { open_action: '', open_content: '' },
          function () {
            $.message({
              message: '接口调用失败！请检查所填写的信息！'
            })
          }
        )
      })
    } else {
      $.message({
        message: '所需要信息不足，请先填写好绑定信息'
      })
    }
  })
}

$('#saveKey').click(function () {
  // 保存数据
  chrome.storage.sync.set(
    {
      apiUrl: $('#apiUrl').val(),
      key: $('#key').val(),
      pic7bu: $('#pic7bu').val()
    },
    function () {
      $.message({
        message: '保存信息成功'
      })
    }
  )
})

$('#blog_info_edit').click(function () {
  $('#blog_info').slideToggle()
})

function get_info(callback) {
  chrome.storage.sync.get(
    {
      apiUrl: '',
      key: '',
      pic7bu: '',
      open_action: '',
      open_content: ''
    },
    function (items) {
      var flag = false
      var returnObject = {}
      if (items.apiUrl === '' || items.key === '' || items.repo === '') {
        flag = false
      } else {
        flag = true
      }
      returnObject.status = flag
      returnObject.apiUrl = items.apiUrl
      returnObject.key = items.key
      returnObject.pic7bu = items.pic7bu
      returnObject.open_content = items.open_content
      returnObject.open_action = items.open_action
      if (callback) callback(returnObject)
    }
  )
}

//发送操作
$('#submit').click(function () {
  sendText()
})

function sendText() {
  get_info(function (info) {
    if (info.status) {
      //信息满足了
      $('#content_submit_text').text('发送中……')
      let content = $('#content').val()
      let from = $('#from').val()
      const params = {
        key: info.key,
        from,
        text: content
      }
      $.get(info.apiUrl, params, function (result) {
        $('#content_submit_text').text('发表新鲜事')
        //发送成功
        chrome.storage.sync.set(
          { open_action: '', open_content: '' },
          function () {
            $.message({
              message: 'biubiubiu~发送成功'
            })
            $('#content').val('')
          }
        )
      }).fail(function () {
        //清空open_action（打开时候进行的操作）,同时清空open_content
        chrome.storage.sync.set(
          { open_action: '', open_content: '' },
          function () {
            $.message({
              message: '网络问题上传失败'
            })
          }
        )
      })
    } else {
      $.message({
        message: '所需要信息不足，请先填写好绑定信息'
      })
    }
  })
}
