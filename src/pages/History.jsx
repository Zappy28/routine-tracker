import Card from "../components/Card";

import { history } from "../data/mockData";


function History(){


return (

<div>


<h1>
History
</h1>



{
history.map((day,index)=>(


<Card 
key={index}
title={day.date}
>


<p>
Medicine:
{day.medicine ? "Taken" : "Missed"}
</p>


<p>
Mood:
{day.mood}/10
</p>


</Card>


))

}



</div>


)

}


export default History;