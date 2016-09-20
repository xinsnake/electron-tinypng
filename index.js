let app = angular.module('electronTinypng', ['mui', 'ngFileUpload'])

app.controller('mainController', ($scope) => {

    $scope.settingsOn = false

    $scope.toggleSettings = () => {
        $scope.settingsOn = !$scope.settingsOn
    }

    $scope.usage = 'N/A'

    $scope.uploadFiles = (files) => {
        console.log(files)
    }
})
