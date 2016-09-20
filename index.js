const {ipcRenderer} = require('electron')

document.addEventListener('dragover', (event) => {
    event.preventDefault()
    return false
}, false)

document.addEventListener('drop', (event) => {
    event.preventDefault()
    return false
}, false)

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

    // upload handler
    $scope.uploadFiles = (files) => {
        console.log(files)
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

