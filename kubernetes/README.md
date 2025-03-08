To Run In Kubernetes on any cluster use below code snippets.

Suggestions: Use k3s(https://k3s.io/) cluster(a light weight and open-source k8s distribution.)


```bash
  git clone git@github.com:Tanq16/ExpenseOwl.git
```
```bash
  kubectl apply -f kubernetes/_namespace.yml
```
```bash
 kubectl apply -f kubernetes/Expenseowl-Deployment.yml
```
```bash
 kubectl apply -f kubernetes/Expenseowl-configmap.yml
```
```bash
 kubectl apply -f kubernetes/Expenseowl-svc.yml
```
```bash
 kubectl apply -f kubernetes/Expenseowl-pvc.yml
```
```bash
 kubectl apply -f kubernetes/Expenseowl-ingress.yml
```
```bash
kubectl port-forward pod/<pod-name> 8080:8080 # Change Pod Name Here

```
```bash
Dashboard: http://expenseowl.localhost/
```
