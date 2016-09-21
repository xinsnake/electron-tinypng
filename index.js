const {ipcRenderer} = require('electron')
const shell = require('electron').shell
const filesize = require('filesize')

// disable accidental drop a file in there
document.addEventListener('dragover', (event) => {
    event.preventDefault()
    return false
}, false)

document.addEventListener('drop', (event) => {
    event.preventDefault()
    return false
}, false)

// my app
let app = angular.module('electronTinypng', ['mui', 'ngFileUpload', 'toastr'])

app.config((toastrConfig) => {
    angular.extend(toastrConfig, {
        autoDismiss: true,
        closeButton: true
    })
})

app.controller('mainController', ($scope, toastr) => {

    // usage number
    $scope.usage = 'N/A'

    ipcRenderer.on('async-count-update', (event, arg) => {
        if (arg.success) {
            $scope.$apply(() => {
                $scope.usage = arg.data
            })
        } else {
            handleError(arg.data)
        }
    })

    // compress files
    $scope.filesToCompress = []

    ipcRenderer.on('async-compress-file-reply', (event, arg) => {
        // console.log(arg)
        $scope.$apply(() => {
            angular.forEach($scope.filesToCompress, (file, index) => {
                if (arg.data.id === file.id) {
                    $scope.filesToCompress[index] = arg.data
                }
            })
        })
    })

    $scope.compressFiles = (files) => {
        angular.forEach(files, (file, index) => {
            if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
                toastr.warning('File ' + file.name + ' is not a PNG or JPG file so it was ignored.', 'File Ignored')
                return
            }

            let f = {}
            f.lastModified = file.lastModified
            f.name = file.name
            f.path = file.path
            f.readableSize = filesize(file.size)
            f.size = file.size
            f.status = 'Pending'
            f.timeAdded = Date.now() * 1
            f.type = file.type
            f.id = f.timeAdded + "::" + f.path
            ipcRenderer.send('async-compress-file', f)
            // console.log(f)
            $scope.filesToCompress.push(f)
            $scope.filesToCompress = $scope.filesToCompress.slice(0, 100)
        })
    }

    // settings ui
    $scope.settingsOn = false

    $scope.toggleSettings = () => {
        $scope.settingsOn = !$scope.settingsOn
    }

    // settings
    $scope.settings = {}
    $scope.savingSettings = false

    ipcRenderer.on('async-load-settings-reply', (event, arg) => {
        if (arg.success) {
            $scope.$apply(() => {
                $scope.settings = arg.data
            })
        } else {
            handleError(arg.data)
        }
    })

    $scope.loadSettings = () => {
        ipcRenderer.send('async-load-settings')
    }

    ipcRenderer.on('async-save-settings-reply', (event, arg) => {
        if (arg.success) {
            handleSuccess('Settings saved.')
            $scope.settingsOn = false
        } else {
            handleError(arg.data)
        }
        $scope.savingSettings = false
    })

    $scope.saveSettings = () => {
        ipcRenderer.send('async-save-settings', $scope.settings)
        $scope.savingSettings = true
    }

    // result handling
    handleError = (error) => {
        console.error(error)
        if (typeof error.message !== 'undefined') {
            toastr.error('Something went wrong: ' + error.message, 'Error')
        } else {
            toastr.error('Something went wrong: ' + error, 'Error')
        }
    }
    handleSuccess = (success) => {
        toastr.success('Settings were successfully saved.', 'Settings')
    }

    // init
    let init = () => {
        $scope.loadSettings()
    }
    init()
})

