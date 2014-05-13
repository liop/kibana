define(function (require) {
  var k4d3 = require('k4d3');
  var $ = require('jquery');
  var _ = require('lodash');
  var typeDefs = require('../saved_visualizations/_type_defs');


  require('css!../styles/visualization.css');

  var module = require('modules').get('kibana/directive');

  module.directive('visualize', function (createNotifier, SavedVis, courier) {
    return {
      restrict: 'E',
      scope : {
        vis: '=',
      },
      link: function ($scope, $el) {
        var chart; // set in "vis" watcher

        function onHover(event) {
          console.log(event);
        }

        $scope.$watch('vis', function (vis, prevVis) {
          if (prevVis && prevVis.destroy) prevVis.destroy();
          if (chart) {
            chart.off('hover');
            chart.off('click');
            chart.destroy();
          }
          if (!(vis instanceof SavedVis)) return;

          var notify = createNotifier({
            location: vis.typeName + ' visualization'
          });

          var params = {
            type: vis.typeName,
          };

          _.merge(vis.params, params);
          _.defaults(params, typeDefs.byName[vis.typeName].params);

          chart = new k4d3.Chart($el[0], params);

          chart.on('hover', onHover);
          chart.on('click', onHover);

          vis.searchSource.onResults(function onResults(resp) {
            courier.indexPatterns.get(vis.searchSource.get('index'))
            .then(function (indexPattern) {
              chart.render(vis.buildChartDataFromResponse(indexPattern, resp));
            })
            .catch(notify.fatal);
          }).catch(notify.fatal);

          vis.searchSource.onError(notify.error);

          $scope.$root.$broadcast('ready:vis');
        });

        $scope.$on('$destroy', function () {
          if ($scope.vis) $scope.vis.destroy();
        });
      }
    };
  });
});