# mongo-as-graphite

Graphite does two things:
- Store numeric time-series data
- Render graphs of this data on demand
It can also be used by numerous dashboard/visualisation tools (ie: Grafana) to show those data.

This project for [Motion Math Games](http://motionmathgames.com/) is a small bridge that allows to present mongo data using the graphite API. This allows
to use Mongo as a backend for Grafana.